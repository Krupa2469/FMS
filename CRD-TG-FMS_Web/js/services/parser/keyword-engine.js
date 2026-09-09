/******************************************************************
 * keyword-engine.js
 * Enterprise Parser V2
 * Keyword Extraction Engine
 ******************************************************************/

console.log("Keyword Engine Loaded");

/*---------------------------------------------------------------
    Extract Keywords
---------------------------------------------------------------*/
function extractKeywords(fields) {

    const keywords = new Set();

    addKeywords(keywords, fields.subject);
    addKeywords(keywords, fields.grievanceDescription);
    addKeywords(keywords, fields.department);
    addKeywords(keywords, fields.category);
    addKeywords(keywords, fields.district);
    addKeywords(keywords, fields.state);
    addKeywords(keywords, fields.complainantName);

    /*-----------------------------------------------------------
        Remove common words
    -----------------------------------------------------------*/

    const stopWords = [

        "THE","AND","FOR","WITH","FROM","THIS","THAT",
        "IS","ARE","WAS","WERE","HAS","HAVE","HAD",
        "OF","TO","IN","ON","AT","BY","AS","AN","A",
        "SHRI","SMT","SRI"

    ];

    const result = [];

    keywords.forEach(word => {

        if (
            word.length > 2 &&
            !stopWords.includes(word)
        ) {

            result.push(word);

        }

    });

    result.sort();

    return result;

}

/*---------------------------------------------------------------
    Add Keywords
---------------------------------------------------------------*/
function addKeywords(set, text) {

    if (!text)
        return;

    text
        .toUpperCase()
        .replace(/[^A-Z0-9 ]/g, " ")
        .split(/\s+/)
        .forEach(word => {

            if (word.trim() !== "") {

                set.add(word.trim());

            }

        });

}

window.extractKeywords = extractKeywords;