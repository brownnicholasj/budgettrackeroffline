const version = '0.0.01';
const CACHE_NAME = `budget-tracker-cache-${version}`;
const DATA_CACHE_NAME = `offlineBudget`;
const FILES_TO_CACHE = [
	'/',
	'/index.html',
	'/index.js',
	'/db.js',
	'/styles.css',
	'/icons/icon-144x144.png',
	'/icons/icon-192x192.png',
	'/icons/icon-512x512.png',
	'https://cdn.jsdelivr.net/npm/chart.js@2.8.0',
	'https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css',
];

// install
self.addEventListener('install', function (evt) {
	evt.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(FILES_TO_CACHE).then(() => self.skipWaiting());
		})
	);
});

// activate
self.addEventListener('activate', (evt) => {
	evt.waitUntil(
		caches.keys().then((keyList) => {
			return Promise.all(
				keyList.map((key) => {
					if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
						console.log('Removing old cache data', key);
						return caches.delete(key);
					}
				})
			);
		})
	);

	self.clients.claim();
});

// fetch
self.addEventListener('fetch', function (evt) {
	if (evt.request.url.includes('/api/')) {
		evt.respondWith(
			caches
				.open(DATA_CACHE_NAME)
				.then((cache) => {
					return fetch(evt.request)
						.then((response) => {
							// If the response was good, clone it and store it in the cache.
							if (response.status === 200) {
								cache.add(evt.request.url, response.clone());
							}
							return response;
						})
						.catch((err) => {
							// Network request failed, try to get it from the cache.
							return cache.match(evt.request);
						});
				})
				.catch((err) => {
					console.log(err);
				})
		);

		return;
	}

	evt.respondWith(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.match(evt.request).then((response) => {
				return response || fetch(evt.request);
			});
		})
	);
});
