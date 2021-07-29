let db;
let versionControl = 2;

const request = window.indexedDB.open('offlineBudget', versionControl || 21);

request.onupgradeneeded = (event) => {
	db = event.target.result;
	const budgetPending = db.createObjectStore('offlineBudget', {
		autoIncrement: true,
	});
	budgetPending.createIndex('pendingStatus', 'pending');
};

request.onsuccess = (event) => {
	db = event.target.result;
	if (navigator.onLine) {
		checkDatabase();
	}
};

request.onerror = (error) => {
	console.log('ERROR:', error);
};

function saveRecord(record) {
	const transaction = db.transaction(['offlineBudget'], 'readwrite');
	const budgetPending = transaction.objectStore('offlineBudget');

	budgetPending.add(record);
}

checkDatabase = () => {
	const transaction = db.transaction(['offlineBudget'], 'readwrite');
	const budgetPending = transaction.objectStore('offlineBudget');
	const getRequest = budgetPending.getAll();

	getRequest.onsuccess = () => {
		if (getRequest.result.length > 0) {
			fetch('/api/transaction/bulk', {
				method: 'POST',
				body: JSON.stringify(getRequest.result),
				headers: {
					'Accept': 'application/json, text/plain, */*',
					'Content-Type': 'application/json',
				},
			})
				.then((response) => response.json())
				.then(() => {
					const transaction = db.transaction(['offlineBudget'], 'readwrite');
					const budgetPending = transaction.objectStore('offlineBudget');

					budgetPending.clear();
				});
		}
	};
};

window.addEventListener('online', checkDatabase);
