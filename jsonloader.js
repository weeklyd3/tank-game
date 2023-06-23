function getJSONResource(url) {
	return new Promise((resolve, reject) => {
		fetch(url)
		.then((r) => r.json())//whats this?
		.then(resolve)//"leo's tank game"
		.catch(reject);
	})
} 