const fs = require('fs');

const parseIdeographFrequency = async () => {
	const kFrequencyRaw = await fs.promises.readFile('./assets/unihan/kFrequency.json', 'utf8');
	const kFrequency = JSON.parse(kFrequencyRaw);

	return char => {
		if(kFrequency[char])
			return kFrequency[char] - 1;

		return null;
	};
};

const parseIdeographStrokes = async () => {
	const kTotalStrokesRaw = await fs.promises.readFile('./assets/unihan/kTotalStrokes.json', 'utf8');
	const kTotalStrokes = JSON.parse(kTotalStrokesRaw);

	return char => {
		if(kTotalStrokes[char] && kTotalStrokes[char].length > 0) {
			return kTotalStrokes[char][0] - 1;
		}

		return null;
	};
};

const parseJouyouKanji = async () => {
	const kJoyoKanjiRaw = await fs.promises.readFile('./assets/unihan/kJoyoKanji.json', 'utf8');
	const kJoyoKanji = JSON.parse(kJoyoKanji);

	return char => {
		if(kJoyoKanji[char])
			return 0;

		return null;
	};
}

const parseHangul = async () => {
	const ksX1001 = await fs.promises.readFile('./assets/ksx1001.txt', 'utf8');

	return char => {
		if(ksX1001.includes(char))
			return 0;

		if(/^[가-힣]$/.test(char))
			return 1;

		return null;
	};
};

const parseHangul2574 = async () => {
	const ksX1001 = await fs.promises.readFile('./assets/ksx1001.txt', 'utf8');
	const additional224 = await fs.promises.readFile('./assets/hangul-additional-224.txt', 'utf8');

	return char => {
		if(ksX1001.includes(char) || additional224.includes(char))
			return 0;

		if(/^[가-힣]$/.test(char))
			return 1;

		return null;
	};
};

const parseUnicodeBlocks = async () => {
	const blocksRaw = await fs.promises.readFile('./assets/blocks.txt', 'utf8');
	const blocksStr = [...blocksRaw.matchAll(/^([0-9A-F]+)..([0-9A-F]+);\s*(.*)$/gm)];

	const blocks = blocksStr.map(([start, end, name], index) => {
		return {
			start: parseInt(start, 16),
			end: parseInt(end, 16),
			index
		};
	});

	return char => {
		const charPoint = char.codePointAt(0);
		const matchingBlock = blocks.find(({ start, end }) => (start <= charPoint) && (charPoint <= end));

		if(!matchingBlock)
			return blocks.length;

		return matchingBlock.index;
	};
};

const groups = {
	'ideograph-frequency': parseIdeographFrequency,
	'ideograph-strokes': parseIdeographStrokes,
	'ideograph-jouyou': parseJouyouKanji,
	'hangul-2350': parseHangul,
	'hangul-2574': parseHangul2574,
	'unicode-blocks': parseUnicodeBlocks,
	'all': async () => char => 0
};

module.exports = groups;
