var SpecialChars = {};

// charset 0 : USA
SpecialChars['@'] = { code: 0x40, charset: 0 };
SpecialChars['['] = { code: 0x5B, charset: 0 };
SpecialChars['\\'] = { code: 0x5C, charset: 0 };
SpecialChars[']'] = { code: 0x5D, charset: 0 };
SpecialChars['{'] = { code: 0x7B, charset: 0 };
SpecialChars['|'] = { code: 0x7C, charset: 0 };
SpecialChars['}'] = { code: 0x7D, charset: 0 };
SpecialChars['~'] = { code: 0x7E, charset: 0 };

// charset 1 : France
SpecialChars['à'] = { code: 0x40, charset: 1 };
SpecialChars['°'] = { code: 0x5B, charset: 1 };
SpecialChars['ç'] = { code: 0x5C, charset: 1 };
SpecialChars['§'] = { code: 0x5D, charset: 1 };
SpecialChars['é'] = { code: 0x7B, charset: 1 };
SpecialChars['ù'] = { code: 0x7C, charset: 1 };
SpecialChars['è'] = { code: 0x7D, charset: 1 };
SpecialChars['¨'] = { code: 0x7E, charset: 1 };

// charset 2 : Germany
// the below one is redundent with France charset
//SpecialChars['§'] = { code: 0x40, charset: 2 };
SpecialChars['Ä'] = { code: 0x5B, charset: 2 };
SpecialChars['Ö'] = { code: 0x5C, charset: 2 };
SpecialChars['Ü'] = { code: 0x5D, charset: 2 };
SpecialChars['ä'] = { code: 0x7B, charset: 2 };
SpecialChars['ö'] = { code: 0x7C, charset: 2 };
SpecialChars['ü'] = { code: 0x7D, charset: 2 };
SpecialChars['ß'] = { code: 0x7E, charset: 2 };

// charset 3 : UK
// similar to USA, only £ code is present at 0x23
SpecialChars['£'] = { code: 0x23, charset: 3 };

// charset 4 : Denmark 1
SpecialChars['Æ'] = { code: 0x5B, charset: 4 };
SpecialChars['Ø'] = { code: 0x5C, charset: 4 };
SpecialChars['Å'] = { code: 0x5D, charset: 4 };
SpecialChars['æ'] = { code: 0x7B, charset: 4 };
SpecialChars['ø'] = { code: 0x7C, charset: 4 };
SpecialChars['å'] = { code: 0x7D, charset: 4 };

// charset 5 : Sweden
SpecialChars['¤'] = { code: 0x24, charset: 5 };
// the 8 chars below can be found elsewhere
// SpecialChars['Ä'] = { code: 0x5B, charset: 5 };
// SpecialChars['Ö'] = { code: 0x5C, charset: 5 };
// SpecialChars['Å'] = { code: 0x5D, charset: 5 };
// SpecialChars['Ü'] = { code: 0x5E, charset: 5 };
// SpecialChars['ä'] = { code: 0x7B, charset: 5 };
// SpecialChars['ö'] = { code: 0x7C, charset: 5 };
// SpecialChars['å'] = { code: 0x7D, charset: 5 };
// SpecialChars['ü'] = { code: 0x7E, charset: 5 };

// cannot find the char 'ê', so i replace it by 'e'
SpecialChars['ê'] = { code: 0x65, charset: 0 };

module.exports = SpecialChars;
