# FontSetify
Font Subsetting done right.

## Description
**Experimantal** font subsetting tool, which is optimized for CJK.

### Background
* There are a lot of Ideograph, Hangul letters.  
* Most of Ideograph letters are infrequently used.

### Approach
Group letters by its usage frequency and subset them into many chunks using `unicode-range` property in `@font-face`.

## Drawbacks
* This script didn't put ligatures into consideration and may break some font features.
* The CSS file (w/ unicode-range) is not optimized as `unicode-range` haven't taken into consideration.

## Usage
```bash
$ git clone https://github.com/HelloWorld017/fontsetify.git
$ cd fontsetify
$ npm i
$ pip install fonttools brotli zopfli # Install pyftsubset
$ npm start # Generate folders, config
$ cp ~/my-fonts/*.ttf fonts/ # Copy your fonts into fonts/ directory.
$ npm start
$ ls -al ./output # Subsets and the Stylesheet are generated.
```

## Options
### groupBy
Prioritized. For each options, select glyphs in remaining glyphs and group them.

Example:
```json
"groupBy": [
	"ideograph-frequency",
	"ideograph-strokes",
	"hangul-2350-11172",
	"unicode-blocks",
	"all"
]
```

#### `ideograph-frequency`
Group Ideograph Letters into 5 groups by its frequency.

> A rough frequency measurement for the character based on analysis of traditional Chinese USENET postings; characters with a kFrequency of 1 are the most common, those with a kFrequency of 2 are less common, and so on, through a kFrequency of 5.

Please refer to [unihan](https://www.unicode.org/reports/tr38/tr38-20.html#kFrequency).

#### `ideograph-strokes`
Group Ideograph Letters by its stroke counts.

#### `ideograph-jouyou`
Group Jouyou Kanji first, and group other Ideograph Letters.

#### `hangul-2350`
Group 2350 Hangul Letters (KS X 1001) first, and group other Hangul Letters.

#### `hangul-2574`
Group 2574 Hangul Letters (KS X 1001 + Additional 224) first, and group other Hangul Letters.

Please refer to [this paper](http://koreantypography.org/wp-content/uploads/2016/02/kst_12_7_2_06.pdf) (`Proposal for Additional Korean Characters in
Complete Code System of Hangeul`).

#### `unicode-blocks`
Group letters by Unicode Blocks.

#### `all`
Group all letters into one group.

### chunkSize
Keep glyphs in each chunk less than this value.

### chunkOverGroups
If it is true, collect small chunks which size is less than the chunkSize and make a larger chunk.

### weightByFileName
Infer font weight by its file name.

Example:
```json
"weightByFileName": {
	"black": 900,
	"extrabold": 800,
	"bold": 700,
	"semibold": 600,
	"medium": 500,
	"regular": 400,
	"medium": 400,
	"semilight": 300,
	"demilight": 300,
	"light": 200,
	"extralight": 100,
	"hairline": 100
}
```
