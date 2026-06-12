const sharp = require('sharp');

const convert = (input, output, width, height) =>
  sharp(input)
    .resize(width, height, { fit: 'inside' })
    .webp({ quality: 85 })
    .toFile(output);

Promise.all([
  convert('weblogo.png', 'weblogo.webp', 250, 80),
  convert('weblogo.png', 'images/weblogo.webp', 250, 80),
  convert('images/ad_leaderboard.png', 'images/ad_leaderboard.webp', 728, 90),
  convert('images/ad_sidebar_square.png', 'images/ad_sidebar_square.webp', 300, 250),
  convert('images/ad_sidebar_tall.png', 'images/ad_sidebar_tall.webp', 300, 600),
  convert('images/ad_infeed.png', 'images/ad_infeed.webp', 728, 90)
]).catch(err => {
  console.error(err);
  process.exit(1);
});
