const yaml = require('js-yaml');
const { DateTime } = require('luxon');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const htmlmin = require('html-minifier');
const Image = require('@11ty/eleventy-img');
const path = require('path');

async function imageShortcode(src, alt, sizes = "(min-width: 60rem) 80vw, (min-width: 40rem) 90vw, 100vw") {
	let srcPrefix = `./src/static/images/`;
	src = srcPrefix + src;
	if(alt === undefined) {
	  // You bet we throw an error on missing alt (alt="" works okay)
	  throw new Error(`Missing \`alt\` on responsiveimage from: ${src}`);
	}
  
	let metadata = await Image(src, {
		widths: [320, 800, 1200],
		formats: ['avif', 'webp', 'jpeg'],
		urlPath: '/images/',
		outputDir: './_site/images/',
	});
  
	let lowsrc = metadata.jpeg[0];
	let highsrc = metadata.jpeg[metadata.jpeg.length - 1];
  
	return `<picture>
	  ${Object.values(metadata).map(imageFormat => {
		return `  <source type="${imageFormat[0].sourceType}" srcset="${imageFormat.map(entry => entry.srcset).join(", ")}" sizes="${sizes}">`;
	  }).join("\n")}
		<img
		  src="${lowsrc.url}"
		  width="${highsrc.width}"
		  height="${highsrc.height}"
		  alt="${alt}"
		  loading="lazy"
		  decoding="async">
	  </picture>`;
  }

module.exports = function(eleventyConfig) {
	// generate images
	eleventyConfig.addNunjucksAsyncShortcode('image', imageShortcode);

	// Disable automatic use of your .gitignore
	eleventyConfig.setUseGitIgnore(false);

	// Merge data instead of overriding
	eleventyConfig.setDataDeepMerge(true);

	// human readable date
	eleventyConfig.addFilter('readableDate', (dateObj) => {
		return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat(
			'dd LLL yyyy'
		);
	});

	// Syntax Highlighting for Code blocks
	eleventyConfig.addPlugin(syntaxHighlight);

	// To Support .yaml Extension in _data
	// You may remove this if you can use JSON
	eleventyConfig.addDataExtension('yaml', (contents) => yaml.load(contents));

	// Copy Static Files to /_Site
	eleventyConfig.addPassthroughCopy({
		'./src/admin/config.yml': './admin/config.yml',
		'./node_modules/alpinejs/dist/cdn.min.js': './static/js/alpine.js',
		'./node_modules/prismjs/themes/prism-tomorrow.css':
			'./static/css/prism-tomorrow.css',
	});

	// Copy Image Folder to /_site
	eleventyConfig.addPassthroughCopy('./src/static/img');

	// Copy favicon to route of /_site
	eleventyConfig.addPassthroughCopy('./src/favicon.ico');

	// Minify HTML
	eleventyConfig.addTransform('htmlmin', function(content, outputPath) {
		// Eleventy 1.0+: use this.inputPath and this.outputPath instead
		if (outputPath.endsWith('.html')) {
			let minified = htmlmin.minify(content, {
				useShortDoctype: true,
				removeComments: true,
				collapseWhitespace: true,
			});
			return minified;
		}

		return content;
	});

	// Let Eleventy transform HTML files as nunjucks
	// So that we can use .html instead of .njk
	return {
		dir: {
			input: 'src',
		},
		htmlTemplateEngine: 'njk',
	};
};
