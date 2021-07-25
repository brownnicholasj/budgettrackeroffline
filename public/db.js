let db;
let budgetVersion;

const request = indexedDB.open('OfflineBudget', budgetVersion || 21);

request.onupgradeneeded = function (e) {
	console.log('Upgrade needed in IndexDB');
	const db = e.target.result;
	const budgetOffline = db.createObjectStore('budget', { autoIncrement: true });
	budgetOffline.createIndex('offlineIndex', 'pending');
};

request.onerror = function (e) {
	console.log(`An error of ${e.target.errorCode} with the budgetOfflineDB`);
};

request.onsuccess = function (e) {
	db = e.target.result;

	if (navigator.onLine) {
		checkDatabase();
	}
};

function checkDatabase() {
	let transaction = db.transaction(['budget'], 'readwrite');

	const offlineBudget = transaction.objectStore('budget');

	const getAll = offlineBudget.getAll();

	getAll.onsuccess = function () {
		if (getAll.result.length > 0) {
			fetch('/api/transaction/bulk', {
				method: 'POST',
				body: JSON.stringify(getAll.result),
				headers: {
					'Accept': 'application/json, text/plain, */*',
					'Content-Type': 'application/json',
				},
			})
				.then((response) => response.json())
				.then((res) => {
					if (res.length !== 0) {
						transaction = db.transaction(['budget'], 'readwrite');

						const currentStore = transaction.objectStore('budget');

						currentStore.clear();
					}
				});
		}
	};
}

const saveRecord = (record) => {
	console.log('saving record');
	const transaction = db.transaction(['budget'], 'readwrite');

	const offlineBudget = transaction.objectStore('budget');

	offlineBudget.add(record);
};

// Listen for app coming back online
window.addEventListener('online', (event) => {
	console.log('you are online');
	checkDatabase();
});
