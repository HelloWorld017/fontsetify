const dedent = require('dedent');
const fontkit = require('fontkit');
const fs = require('fs');
const groups = require('./groups');
const signale = require('signale');
const ttf2eot = require('ttf2eot');
const ttf2svg = require('ttf2svg');
const ttf2woff = require('ttf2woff');
const ttf2woff2 = require('ttf2woff2');
const path = require('path');
const promisePipe = require('promisepipe');

const init = async () => {
	let initSuccess = true;

	try {
		childProcess.execSync('pyftsubset --help');
	} catch (err) {
		signale.error('Subsetting tool not available. How to install: `pip install fonttools brotli zopfli`');
		throw new Error("pyftsubset not found");
	}

	try {
		await fs.promises.mkdir('./fonts');
		signale.info("Created font directories.");
		initSuccess = false;
	} catch(err) {}

	let config = null;
	const fonts = (await fs.promises.readdir('./fonts'))
		.map(font => path.resolve('./fonts', font));

	try {
		const configRaw = await fs.promises.readFile('./config.json', 'utf8');
		config = JSON.parse(configRaw);
	} catch(err) {
		await fs.promises.copyFile('./config.default.json', './config.json');
		signale.info("Created configuration.");
		initSuccess = false;
	}

	try {
		await fs.promises.mkdir('./output');
	} catch(err) {}

	if(!initSuccess) {
		throw new Error("Initialized default files");
	}

	return { config, fontPaths: fonts };
};

const stylesheet = [];
const indexes = {};
const emitFont = async (config, font, chars) => {
	if(chars.length === 0) return;
	if(!indexes[font])
		indexes[font] = 0;

	const basename = path.basename(font.fileName, path.extname(font.fileName));
	const filename = `${basename}_${indexes[font]}`;
	const target = path.resolve('./output/', `${filename}`);

	const subset = font.createSubset();
	const glyphs = chars.map(char => font.glyphForCodePoint(char.codePointAt(0)));
	glyphs.forEach(glyph => subset.includeGlyph(glyph));

	await promisePipe(
		subset.encodeStream(),
		fs.createWriteStream(`${target}.ttf`)
	);

	const ttfBuffer = await fs.promises.readFile(`${target}.ttf`);
	await fs.promises.writeFile(`${target}.eot`, ttf2eot(ttfBuffer));
	await fs.promises.writeFile(`${target}.svg`, ttf2svg(ttfBuffer));
	await fs.promises.writeFile(`${target}.woff`, ttf2woff(ttfBuffer));
	await fs.promises.writeFile(`${target}.woff2`, ttf2woff2(ttfBuffer));

	let weight = null;
	const weightKey = Object.keys(config.weightByFileName)
		.find(weightName => font.fileName.toLowerCase().replace(/[^a-z]/g, '').includes(weightName));

	if(!weightKey)
		weight = config.weightByFileName[weightKey];

	const range = [];
	let rangeStart = chars[0].codePointAt(0);
	let rangeEnd = rangeStart;

	for(let i = 1; i <= chars.length; i++) {
		const codePoint = (i < chars.length) ?
			chars[i].codePointAt(0) :
			-1;

		if(codePoint !== rangeEnd + 1) {
			if(rangeStart === rangeEnd) {
				range.push(`U+${rangeStart.toString(16)}`);
			} else {
				range.push(`U+${rangeStart.toString(16)}-${rangeEnd.toString(16)}`);
			}

			rangeStart = codePoint;
			rangeEnd = codePoint;
		} else {
			rangeEnd++;
		}
	}

	stylesheet.push(dedent`
		@font-face {
			font-family: "${font.familyName}",
			src: url('${target}.eot?#iefix') format('embedded-opentype'),
				url('${target}.woff') format('woff'),
				url('${target}.woff2') format('woff2'),
				url('${target}.svg') format('svg'),
				url('$[target}.ttf') format('truetype');
			${weight ? `font-weight: ${weight};` : ''}
			unicode-range: ${range.join(', ')};
		}
	`);
};

const processFont = async (config, font, usingGroups) => {
	const chars = font.characterSet;
	const groups = {};

	chars.forEach(char => {
		for(let groupIdx in usingGroups) {
			const charStr = String.fromCharCode(char);
			const isInGroup = usingGroups[groupIdx](charStr);
			if(isInGroup !== null) {
				const groupKey = `${groupIdx}_${isInGroup}`;
				if(!groups[groupKey])
					groups[groupKey] = [];

				groups[groupKey].push(charStr);
			}
		}
	});

	const leftChars = [];
	for(const groupName in groups) {
		const group = groups[groupName];

		for(let i = 0; i < group.length; i += config.chunkSize) {
			const groupChars = group.slice(i, config.chunkSize);

			if(groupChars.length < config.chunkSize) {
				if(config.chunkOverGroups) {
					leftChars.push(...groupChars);
					continue;
				}
			}

			await emitFont(config, font, groupChars);
		}
	}
};

(async () => {
	let config, fontsPaths;
	try {
		({ config, fontPaths } = await init());
	} catch(e) {
		return;
	}

	const fonts = {};
	for (const fontPath of fontPaths) {
		const font = await new Promise((resolve, reject) => {
			fontkit.open(fontPath, (err, font) => {
				if(err) return reject(err);

				resolve(font);
			});
		});

		fonts[fontPath] = font;
		font.fileName = path.basename(fontPath);
		signale.success(`Imported ${font.fullName} from ${fontPath}`);
	}

	const usingGroups = [];
	for(const groupName of config.groupBy) {
		usingGroups.push(await groups[groupName]());
	}

	for(const font in fonts) {
		await processFont(config, fonts[font], usingGroups);
		signale.success(`Processed ${font.fullName}`);
	}

	await fs.promises.writeFile(
		`./output/stylesheet.css`,
		stylesheet.join('\n\n')
	);

	signale.success(`Done transforming fonts!`);
})();
