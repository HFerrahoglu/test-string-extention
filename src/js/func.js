// Constants
const LOREM_IPSUM_TEXT =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget ultricies ultricies, nunc nisl aliquam nunc, vitae aliquam';
const PUNCTUATION_REGEX = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g;
const WHITESPACE_REGEX = /\s+/g;

// Core functionality
function generateLoremIpsum(length, removeSpace, removePunct) {
  // Performance optimization: pre-calculate processed text
  let baseText = LOREM_IPSUM_TEXT;
  if (removePunct) {
    baseText = baseText.replace(PUNCTUATION_REGEX, '');
  }
  if (removeSpace) {
    baseText = baseText.replace(WHITESPACE_REGEX, '');
  }
  
  // Calculate how many times we need to repeat the base text
  const repeatCount = Math.ceil(length / baseText.length);
  let result = baseText.repeat(repeatCount);
  
  // Trim to exact length
  result = result.slice(0, length);
  
  // If we still need more characters, pad with appropriate character
  if (result.length < length) {
    const paddingChar = removeSpace ? 'a' : ' ';
    result += paddingChar.repeat(length - result.length);
  }
  
  return result;
}

// Expose function to be used in other files
window.generateLoremIpsum = generateLoremIpsum;
