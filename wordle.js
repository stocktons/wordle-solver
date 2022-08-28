"use strict";

const os = require("os");
const fsP = require("fs/promises");
const DICT_PATH = "/usr/share/dict/words";

/** Wordle Solver
 * 
 * Enter a partially known word, your known letters, and your eliminated letters,
 * and receive a list of possible solutions.
 * 
 * To run this file type in your terminal: 
 * 
 * node wordle.js partialWord  knownGoodLetters  knownBadLetters
 * 
 * Example:
 * node wordle.js ze--- r dfsol
 * 
 * output:
 * [ 'zebra' ]
 *            
 */


/** solve 
 * 
 * Takes in:
 * 
 * partialWord: your word, with unknown letters as dashes, like 'ze---'
 * knownLetters: a string of known letters with unknown position like 'r'
 * incorrectLetters: a string of letters already incorrectly guessed, like 'dfsol'
 * 
 * Returns an array of possible solutions. 
 */

async function solve(partialWord, knownLetters, incorrectLetters, wordLength = 5) {
  console.log('solve: ', partialWord, knownLetters, incorrectLetters, wordLength);

  // use built-in dictionary to create a starting list of words based on length
  // defaults to five-letter words for Wordle
  const wordList = await createWordList(DICT_PATH, wordLength);

  // an object mapping indexes to known letters to establish fixed letters
  const idxsToLtrs = getLtrIdxs(partialWord);

  // filter full wordList to find words with exact letter/index matches to partialWord
  const matchingLtrIndexWords = filterWords(idxsToLtrs, wordList);

  // filter matched-index-words by known letters of unknown index
  const onlyWordsWithKnownLetters = filterWords(knownLetters, matchingLtrIndexWords);
  
  // filter words containing all correct letters to remove words with known incorrect letters
  const remainingWords = filterWords(incorrectLetters, onlyWordsWithKnownLetters, false)

  // anything left is a possible solution
  console.log(remainingWords);
}


/** filterWords
 * 
 * A Swiss army knife function to filter words out of a list in multiple
 * ways
 * 
 * @param {string[]} startingList An array of words to be filtered;
 * @param {(Object|string)} filter An object containing index/character
 * pairs or a string containing characters to filter by;
 * @param {boolean} match if true, keep the results matching filter, if false, 
 * keep results that do not match the filter;
 * 
 * Examples: 
 * 
 * Keep all words matching filter: a word that begins with 'ze'
 * ******************
 * input:
 *   startingList: [...all five-letter words from os dictionary]
 *   filter: {0: 'z', 1: 'e'}
 * 
 * output:
 *   ['zebra', 'zebub', 'zeism', 'zeist', 'zemmi', 'zemni', 'zerda', 'zesty']
 * 
 * 
 * Keep all words matching filter: must contain r at any index
 * ******************
 * input: 
 *   startingList: ['zebra', 'zebub', 'zeism', 'zeist', 'zemmi', 'zemni', 'zerda', 'zesty']
 *   filter: 'r'
 * 
 * output: ['zebra', 'zerda']
 * 
 * 
 * Discard all words matching filter: any words with d 
 * ****************** 
 * input: 
 *   startingList: ['zebra', 'zerda']
 *   filter: 'd'
 *   match: false
 * 
 * output: ['zebra']
 * 
 */
function filterWords(filter, startingList, match = true) {
  let filteredList = startingList;

  // keep words with exact letters in exact spots
  if (match) {
    if (typeof filter === "object") {
      for (const idx in filter) {
        filteredList = startingList.filter(w => w[idx] === filter[idx]);
        startingList = filteredList;
      }
    // keep words with correctly guessed letters in unknown spots
    } else {
      for (const char of filter) {
        filteredList = startingList.filter(w => w.includes(char));
        startingList = filteredList;
      }
    }
    // keep words without incorrectly guessed letters
  } else {
    for (const char of filter) {
      filteredList = startingList.filter(w => !w.includes(char));
      startingList = filteredList;
    }
  }

  return filteredList;
}

/** readFile
 *
 * Takes file path and encoding as input for reading file. Uses `encoding`,
 * which defaults to standard text: `utf8`.
 *
 * Logs error and exits process if error.
 * Returns file contents on success.
 */
async function readFile(filePath, encoding = "utf8") {
  try {
    return await fsP.readFile(filePath, encoding);
  } catch (err) {
    console.error(`Couldn't read from: ${filePath}`);
    process.exit(1);
  }
}

/** getLinesFromString
 *
 * Takes string input.
 * Returns an array containing each non-empty line of file as an element.
 */
function getLinesFromString(string, len) {
  // Using the EOL constant from the node os module // to identify the
  // correct end-of-line (EOL) character // that is specified by the
  // operating system it's running on // this ensures we always know how to
  // identify the end of a line // \n on Linux and macOS, \r\n on Windows.
  return (
    string
      .split(os.EOL)
      .filter(u => u !== "" && u.length === len)
  );
}

/** createWordList
 * 
 * Takes a file path to a dictionary and a word length.
 * Returns an array of words from the dictionary matching that word length.
 * 
 */
async function createWordList(filePath, length) {
  const allWords = await readFile(filePath);
  const wordsOfLen = getLinesFromString(allWords, length);
  return wordsOfLen;
}

/** getLtrIdxs 
 * 
 * Takes in a partial word, like '-u-e-', where the dashes represent 
 * blanks. It finds the indexes of all the letters, and returns an object of those 
 * index/letter pairs. 
 */
 function getLtrIdxs(partialWord) {
  let idxsToLtrs = {};
  for (let i = 0; i < partialWord.length; i++) {
    if (partialWord[i] !== "-") {
      idxsToLtrs[i] = partialWord[i];
    }
  }
  return idxsToLtrs;
}

const [node, path, partialWd, goodLtrs, badLtrs, len] = process.argv

solve(partialWd, goodLtrs, badLtrs, len);
