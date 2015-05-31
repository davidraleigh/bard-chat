/**
 * Created by davidraleigh on 5/20/15.
 */
var ParseUtils = function() {};

String.prototype.capitalizeFirstLetter = function() {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.capitalizeAllFirstLetters = function() {//exceptionList) { // exception list would be like of, de, etc...
  if (this.length === 0)
    return;

  // get indices to capitalize
  var result = this.toLowerCase();
  var match, indexes= [];
  var re = /([ \t\n](?=[A-Za-z])(?!(of|de)))/g;
  while ((match = re.exec(result)) != null)
    indexes.push(match.index + 1);
  var strSplit = result.split('');
  // set the first index to capitalized as the regex doesn't catch that
  strSplit[0] = strSplit[0].toUpperCase();
  indexes.forEach(function(index) {
    strSplit[index] = strSplit[index].toUpperCase();
  });
  return strSplit.join('');
};

function sortByWordCount(a, b) {
  var diff = b.split(' ').length - a.split(' ').length;
  if (diff !== 0)
    return diff;
  else if (b > a)
    return -1;
  return 1;
};

ParseUtils.getTitles = function() {
  return ['Sir', 'Lord', 'Count', 'Captain', 'King', 'Countess', 'Prince', 'Princess', 'Saint'];
};

ParseUtils.getWordOccurrence = function(text, subString, allowOverlapping) {
  text+="";
  subString+="";
  if(subString.length<=0) return text.length+1;

  var n=0, pos=0;
  var step=(allowOverlapping)?(1):(subString.length);

  while(true){
    pos=text.indexOf(subString,pos);
    if(pos>=0){ n++; pos+=step; } else break;
  }
  return(n);
}

ParseUtils.sentenceToEndStopped = function(sentence) {
  sentence = sentence.trim();
  var endStoppedPhrases = sentence.match(/[^\:\;]+[\:\;\.\?\!']+(?=[ \n]|$)/g);
  var results = [];
  if (endStoppedPhrases === null)
    return results;
  results = endStoppedPhrases.map(function(endStopped) {
    return endStopped.replace(/[\:\;]/g, '').trim().capitalizeFirstLetter();
  });

  return results;
};

ParseUtils.sentenceToCommaPhrase = function(sentence, minPhraseSize) {
  // TODO require that phrases are at least 2 words long
  // TODO separate out quoted sections first
  sentence = sentence.trim();
  var phrases = sentence.match(/[^\.\!\?\:\;\,]+[\:\;\.\?\!\,']+(?=[ \n]|$)/g);
  var results = [];
  if (phrases === null)
    return results;
  results = phrases.map(function(endStopped) {
    return endStopped.replace(/[\:\;\,]/g, '').trim().capitalizeFirstLetter();
  });

  return results;
};

ParseUtils.linesToSentences = function(lines, properNouns) {
  // if this hasn't been defined let it be an empty array
  properNouns = properNouns || [];
  // return array
  var sentences = [];

  var currentSentence = "";
  var currentLine = null;
  for (var i = 0; i < lines.length; i++) {
    // get the current line
    currentLine = lines[i].trim();
    if (currentLine.length === 0)
      continue;

    // split the line by regex for sentence endings
    // this will not return any results if there is no separating character (.?! etc)
    var result = currentLine.match( /[^\.!\?]+[\.!\?']+(?=[ \n]|$)/g );

    // if there are no splits then the whole line is part of another sentence
    if (result === null) {
      if (currentSentence.trim().length > 0) {
        // if there is a current sentence add this sentence to it

        // grab the first word of the line and check for Proper noun table
        var firstWord = currentLine.split(' ')[0];
        var firstLetter = firstWord[0];
        if (properNouns.indexOf(firstWord) === -1)
          firstLetter = firstLetter.toLowerCase();

        currentSentence = currentSentence + " " + firstLetter + currentLine.slice(1);
      } else {
        // if there isn't a current sentence, start it from this line
        currentSentence = currentLine.slice(0);
      }
      continue;
    }

    // this WILL return a results even if there are no separating characters (.?! etc)
    result = currentLine.match( /[^\.!\?]+([\.!\?']|$)+(?=[ \n]|$)/g );//[^\.!\?]+([\.!\?]|$)+
    // if there is a previous sentence
    if (currentSentence.trim().length > 0) {
      // grab the first word of the line and check for Proper noun table
      var firstWord = result[0].split(' ')[0];
      var firstLetter = firstWord[0];
      if (properNouns.indexOf(firstWord) === -1)
        firstLetter = firstLetter.toLowerCase();

      sentences.push((currentSentence + " " + firstLetter + result[0].slice(1)).capitalizeFirstLetter());
    } else {
      sentences.push(result[0].capitalizeFirstLetter());
    }

    for (var j = 1; j < result.length - 1; j++) {
      sentences.push(result[j].trim().capitalizeFirstLetter());
    }

    if (/[^\.!\?]+[\.!\?']+(?=[ \n]|$)/g.test(result[result.length - 1]) && result.length > 1) {
      sentences.push(result[result.length - 1].trim().capitalizeFirstLetter());
      // TODO it seems like this assignment is unnecessary
      currentSentence = "";
    } else if (result.length > 1) {
      currentSentence = result[result.length - 1].trim();
    } else {
      // TODO it seems like this assignment is unnecessary
      currentSentence = "";
    }
  }
  if (currentSentence.trim().length > 0) {
    sentences.push(currentSentence.trim().capitalizeFirstLetter());
  }

  return sentences;
};

ParseUtils.extractProperNouns = function(text) {
  // trim of leading and trailing whitespace
  text = text.trim();
  // maybe with properNouns?
  var re = /(|[ \t\n]+)(([A-Z][A-Za-z]+([ \t\n]+|))+(((of )(?=[A-Z]))|((de )(?=[A-Z]))|))+/g;
  //var re = /([\n\t\[ ]+[A-Z][A-Za-z]+( of| de|))+/g;
  //var re = /[\t\n ]+(([A-Z][a-z]+(( (of|de) [A-Z][a-z]+)|[ a-z]|)))+/g; // var re = /[\t\n ]+(([A-Z][a-z]+(( (of|de) [A-Z][a-z]+)|[ a-z]|)))+/g;
  var match = null;
  var properNounMap = {};
  // collect all words that start with a capital letter
  while ((match = re.exec(text)) != null) {
    var properNoun = text.slice(match.index, match.index + match[0].length);
    properNounMap[match.index + match[0].length] = properNoun;
  }

  // remove any words that start with a capital letter but are preceded by a . ? or !
  var keysToDelete = [];
  for (var key in properNounMap) {
    //((.')|[\?\.!\]])[\t ]+
    var temp = properNounMap[key];
    var reStart = "(^|[\\?\\.!\\]'])" + temp;//var reStart = "(^|((.')|[\\?\\.!\\]']))" + temp;
    var regexStart = new RegExp(reStart);
    var reBracket = "([\\[][\\w\\s\\.\\?!:;,\"']*)"+ temp + "([\\w\\s\\.\\?!:;,\"']*[\\]])";
    var regexBracket = new RegExp(reBracket);
    // always start 2 back so that we can maybe capture instances
    var reIndexStart = parseInt(key) - temp.length - 1;
    if (reIndexStart < 0) {
      reIndexStart = 0;
    }
    var reIndexEnd = parseInt(key);
    var testRegion = text.slice(reIndexStart, reIndexEnd)
    if (regexStart.test(testRegion)) {
      // now that this regex is in the properNounMap see if there are pieces to keep
      var tempSplit = temp.trim().split(/\s+/);
      if (tempSplit.length > 1) {
        // if 'of' or 'de' is the second word then let's try assuming the whole thing is a title:
        if (tempSplit[1] === 'of' || tempSplit[1] === 'de') {
          continue;
        }

        var newStart = text.indexOf(tempSplit[1], parseInt(key) - temp.length);
        var slicedValue = text.slice(newStart, parseInt(key));
        properNounMap[key] = slicedValue;
      } else {
        keysToDelete.push(key);
      }
    } else if (regexBracket.test(text)) {
      var indexOfStart = parseInt(key) - temp.length;
      var tempSplit = temp.trim().split(/\s+/);
      var newStart = null; //text.indexOf(tempSplit);
      var endIndex = null; //parseInt(key);
      var bDestroyOldKV = true;
      var bCreateWord = false;
      tempSplit.forEach(function(item, index, array) {
        if (item.toUpperCase() === item && newStart === null) {
          newStart = text.indexOf(item, indexOfStart); // we're assuming a word doesn't appear twice in the brackets
          endIndex = newStart + item.length;
          indexOfStart = endIndex;
        } else if (item.toUpperCase() === item) {
          endIndex = text.indexOf(item, indexOfStart) + item.length;
          indexOfStart = endIndex;
        } else if (newStart !== null) {
          // if we've encounterd a not-all-caps word after a all caps, then return
          bCreateWord = true;
        } else {
          // I guess this doesn't do anything? Just skips it?
          console.log(item);
        }
        if (bCreateWord || (endIndex === parseInt(key) && newStart !== null)) {
          var tempWord = text.slice(newStart, endIndex);
          properNounMap[endIndex] = tempWord.capitalizeAllFirstLetters();
          if (endIndex === parseInt(key)) {
            bDestroyOldKV = false;
          }
          newStart = null;
          endIndex = null;
        }
      });
      if (bDestroyOldKV) {
        keysToDelete.push(key);
      }
    }

  }

  // TODO deleting while iterating causes problems in other languages, so I'm assuming the same thing here?
  keysToDelete.forEach(function(key) {
    delete properNounMap[key];
  });

  function sortNumber(a,b) {
    return parseInt(a) - parseInt(b);
  }

  var results = [];
  var vals = Object.keys(properNounMap).sort(sortNumber);
  vals.forEach(function(key) {
    results.push(properNounMap[key].trim());
  });

  return results;
};

ParseUtils.allCapsToCapitalized = function(name) {
  if (/[A-Z]{2,}/g.test(name)) {
    var words = name.split(' ');
    var newName = "";
    words.forEach(function(element) {

      if (element.toLowerCase() === 'de' || element.toLowerCase() === 'of') {
        // if de or of then shift to all lower case
        element = element.toLowerCase();
      } else if (/^(IX|IV|V?I{0,3})$/.test(element) === false) {
        // if not a roman numeral and not a 'de' or 'the'
        element = element.toLowerCase().capitalizeFirstLetter();
      }
      newName += " " + element;
    });
    name = newName.trim();
  }
  return name;
}

if ( typeof module !== "undefined" ) {
  exports.ParseUtils = ParseUtils;
}