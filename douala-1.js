const { connect } = require("puppeteer-real-browser");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs").promises;

// Chemin vers le dossier de l'extension NopeCHA
const extensionPath = path.resolve(
	"C:\\Users\\HP\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 72\\Extensions\\dknlfmjaanfblgfdfebhijalfmhmjjjo\\0.4.12_0"
);

async function launchBrowserWithNopeCHA() {
	return await puppeteer.launch({
		headless: false,
		args: [
			`--disable-extensions-except=${extensionPath}`,
			`--load-extension=${extensionPath}`,
		],
	});
}
const delay = (time) => new Promise((resolve) => setTimeout(resolve, time));

async function passCloudflareTurnstile(url) {
	const { browser, page } = await connect({
		headless: false,
		args: [],
		customConfig: {},
		turnstile: true,
		connectOption: {},
		disableXvfb: false,
		ignoreAllFlags: false,
	});

	console.log("🚀 Démarrage de passCloudflareTurnstile pour URL:", url);

	await page.goto(url);
	console.log("✅ Navigation vers la page effectuée");

	// await page.waitForNavigation({ waitUntil: "domcontentloaded" });
	// console.log("✅ Page complètement chargée après Cloudflare");

	return { browser, page };
}
async function submitCandidate(candidateData) {
	console.log("🚀 Démarrage de la soumission pour:", candidateData.name);

	// Étape 1 et 2: Cloudflare initial
	// console.log("⏳ Tentative de passage Cloudflare initial...");
	// let { browser, page } = await passCloudflareTurnstile(
	// 	"file:///C:/Users/desire/Desktop/tcf_canada/tcf-runtime/examen.html"
	// );
	// console.log("✅ Premier passage Cloudflare réussi");

	// try {
	// 	await page.waitForFunction(
	// 		() => {
	// 			const elements = document.querySelectorAll("h2");
	// 			return Array.from(elements).some((el) =>
	// 				el.textContent.includes("TCF-CANADA")
	// 			);
	// 		},
	// 		{ timeout: 3000 }
	// 	);
	// 	console.log('✅ Élément "TCF-CANADA');
	// } catch (error) {
	// 	console.error('❌ Erreur: Élément "TCF-CANADA" non trouvé:', error);
	// 	throw error;
	// }

	// await page.click('button[type="submit"]');
	// console.log("✅ Formulaire afficher");
	// await browser.close();

	// Étape 5: Second passage Cloudflare
	console.log("⏳ Tentative du second passage Cloudflare...");
	({ browser, page } = await passCloudflareTurnstile(
		"file:///C:/Users/desire/Desktop/tcf_canada/tcf-runtime/inscription.html"
	));
	console.log("✅ Second passage Cloudflare réussi");

	// Étape 6: Remplissage du formulaire
	console.log("⏳ Début du remplissage du formulaire...");
	try {
		await page.type('input[name="utilisateur[email]"]', candidateData.email); // Email
		console.log("✅ Email saisi");
		await delay(2000);
		const fileInput = await page.$('input[type="file"][name="kyc[avatar]"]');
		await fileInput.uploadFile(candidateData.photoPath);
		console.log("✅ photo saisi");
		await delay(2000);

		await page.type('input[name="utilisateur[name]"]', candidateData.name); // Nom
		await delay(2000);
		await page.type(
			'input[name="utilisateur[firstname]"]',
			candidateData.prenom
		);
		await delay(2000); // Prénom
		// Mot de passe
		await page.type(
			'input[name="utilisateur[password]"]',
			candidateData.password
		);
		console.log("✅ password saisi");

		// Date de naissance
		await page.type(
			'input[name="utilisateur[birthdate]"]',
			candidateData.birthDate
		);
		console.log("✅ birthDate saisi");

		// numero
		// const phoneNumber = String.candidateData.numero;
		// await page.type('input[name="utilisateur[phoneNumber]"]', phoneNumber);
		// console.log("✅ numero saisi");

		// Sélectionner "Immigration au Canada" avec la valeur "F"
		await page.select('select[name="utilisateur[document]"]', "");

		// Numéro de CNI ou Passeport
		await page.type(
			'input[name="utilisateur[numeroDocument]"]',
			candidateData.cni_num
		);
		console.log("✅ cni_num saisi");

		// Télécharger la photo recto
		const fileInputRecto = await page.$(
			'input[type="file"][name="kyc[frontSidePhoto]"]'
		);
		await fileInputRecto.uploadFile(candidateData.cniRectoPath);
		console.log("✅ front_pic");

		// Télécharger la photo  verso
		const fileInputVerso = await page.$(
			'input[type=file][name="kyc[backSidePhoto]"]'
		);
		await fileInputVerso.uploadFile(candidateData.cniVersoPath);
		console.log("✅ verso_pics");
	} catch (error) {
		console.error("❌ Erreur pendant le remplissage du formulaire:", error);
		throw error;
	}

	// Étape 8: Cliquer sur submit
	// await page.click('button[type="submit"]');

	console.log("✅ Formulaire soumis avec succès");

	// Fermer le navigateur
	// await browser.close();

	return candidateData.name;
}

async function main() {
	const candidates = [
		{
			email: "jL8Jt@example.com",
			photoPath: "C:UsersdesirePicturespassport_verso.jpeg",
			name: "Jean Dupont",
			prenom: "Prenom1",
			password: "password1",
			birthDate: "19-05-2000", // format DD/MM/YYYY
			numero: "00237623456789",
			cni_num: "123456789",
			cniRectoPath: "C:UsersdesirePicturesphoto .jpeg",
			cniVersoPath: "C:UsersdesirePicturesphoto.jpeg",
		},
	];

	const results = await Promise.all(candidates.map(submitCandidate));

	// Enregistrer les résultats dans un fichier texte
	const logEntries = results.map(
		(candidateData) =>
			`candidat${candidateData.id}: ${candidateData.Legal_first_name} - ${
				candidateData.Client_number
			} - ${new Date().toISOString()}`
	);
	await fs.appendFile("candidates_submitted.txt", logEntries.join("\n") + "\n");
}

main().catch(console.error);
