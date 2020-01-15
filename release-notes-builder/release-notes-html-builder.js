/*
    Copyright (C) 2020 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

const buildHtmlConfig = (rows) => {
  // first row contains header
  const headerRow = rows[0];

  /*
    Skip first row (header) and reverse,
    because document content goes from bottom to top
  */
  const contentRows = rows.slice(1).reverse();

  const htmlHeader = `<p>${headerRow.Header}</p>`;

  const htmlConfig = {
    header: [htmlHeader],
    links: [],
    descriptions: [],
  };

  contentRows.forEach((row) => {
    const hash = (Date.now() * Math.random()).toFixed();

    const title = row.Title;
    const version = row.Date && row.Version ?
      ` (${row.Version}, ${row.Date})` :
      '';

    // replace '\n' with "html break line" symbols;
    //const rowDescription = row.Description.replace(/\n/g, '&#10;&#13;');

    const link = `<p><a href="#${hash}">${title}${version}</a></p>`;
    const description =
      `<h3 id="${hash}">${title}${version}</h3><p>${row.Description}</p>`;

    htmlConfig.links.push(link);
    htmlConfig.descriptions.push(description);
  });

  return htmlConfig;
};

module.exports = (content) => {
  if (!content || !content.length) {
    console.error('WRONG RELEASE NOTES CONTENT');
    return;
  }

  const htmlConfig = buildHtmlConfig(content);

  const html = htmlConfig.header
    .concat(htmlConfig.links)
    .concat(htmlConfig.descriptions)
    .join('\n');

  return html;
};
