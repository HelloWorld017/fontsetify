# FontSetify
Font Subsetting done right.

## Description

## Drawbacks
* This script didn't put ligatures into consideration and may break some font features.
* Only TTFs are supported.

## Options

### groupBy
Prioritized. Select glyphs in remained glyphs and group.

### chunkOverGroups
If it is enabled, collect small chunks which size is less than the chunkSize and make a larger chunk.
