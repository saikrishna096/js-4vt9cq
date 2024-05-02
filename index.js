import {
  sampleBase64pdf1,
  sampleBase64pdf2,
  sampleMultipleJPGs,
  sampleHtmlContent,
} from './constants.js';

var multiplBase64Pdfs = [sampleBase64pdf1, sampleBase64pdf2];

/**
 * To print single pdf file. We don’t need PDF.js. It can be done with Print.js i.e. we can use global 'printJS' method which can accept both pdf file Url or base64 pdf data.
 */
const printSingleBase64Pdf = () => {
  printJS({
    printable: sampleBase64pdf1,
    type: 'pdf',
    base64: true,
  });
};

/**
 * Print multiple images with Print.js is very easy. All you need to do is to pass your image file Urls in printable key in array in printJS method
 */
const printMultipleImages = () => {
  printJS({
    printable: sampleMultipleJPGs,
    type: 'image',
  });
};

/**
 * For printing HTML content all you need is valid html code and pass it in printJS method
 */
const printSingleHtml = () => {
  printJS({
    printable: sampleHtmlContent,
    type: 'raw-html',
  });
};

//#region Print multiple pdf files

/**
 * Merge different PDF file & save or print as one single PDF file
 */
const printMultipleBase64Pdfs = () => {
  getMultiplePngImagesWithImgTag().then((multiplePngImagesWithImgTag) => {
    // Now we have all converted base64 PNGs in image tag and we are ready to render them as html content to print as one single file with Print.js
    printJS({
      printable: multiplePngImagesWithImgTag,
      type: 'raw-html',
      base64: false,
    });
  });
};

/**
 * 	Iterate all base64 PDF files and continuously add in one variable as multiple base64 PNG files
 *  Render multiple base64 PNG files in one html and print it in one single PDF file
 */
const getMultiplePngImagesWithImgTag = () => {
  return new Promise((resolve, reject) => {
    var docPromiseList = [];
    multiplBase64Pdfs.forEach((doc, index) => {
      docPromiseList.push(convertBase64PdfToBase64Png(doc));
    });

    // So far we have all our base64 PNG files.Now only thing left to do is to merge them  and save or print them as single PDF file

    // We will use concept of PDF.js here i.e.render multiple base64 PNG files in one html and print it in one single PDF file

    Promise.all(docPromiseList)
      .then((res) => {
        if (res && res.length) {
          let doc = '';
          // These two loops are getting base64 PNG where
          // first loop is for each document and second loop is for each page of document
          for (let i = 0; i < res.length; i++) {
            for (let j = 0; j < res[i].length; j++) {
              // get all docs in base64PNG in order to print with Print.js with docType as rawHTML
              doc = doc.concat(
                `<div style="text-align:center"><img src="${res[i][j]}"/ style="object-fit:cover;"></div><br/>`
              );
            }
            doc = doc.concat(`<div style="page-break-before: always;"></div>`);
          }
          resolve(doc);
        }
      })
      .catch((err) => {
        reject(err);
      });
  });
};

const convertBase64PdfToBase64Png = (base64PDF) => {
  return new Promise((resolve, reject) => {
    // Loaded via <script> tag, create shortcut to access PDF.js exports.
    var pdfjsLib = window['pdfjs-dist/build/pdf'];

    // The workerSrc property shall be specified.
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.6.347/pdf.worker.js';

    // atob() is used to convert base64 encoded PDF to binary-like data.
    // (See also https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/
    // Base64_encoding_and_decoding.)
    var pdfData = atob(base64PDF);

    // Using DocumentInitParameters object to load binary data.
    pdfjsLib
      .getDocument({ data: pdfData })
      .promise.then((pdf) => {
        let totalPages = pdf.numPages;
        let totalPagePromiseList = [];
        for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
          totalPagePromiseList.push(
            convertEachBase64PdfPageToBase64PngPage(pdf, currentPage)
          );
        }

        Promise.all(totalPagePromiseList)
          .then((newRes) => {
            resolve(newRes);
          })
          .catch((newError) => {
            reject(newError);
          });
      })
      .catch((error) => {
        // PDF loading error
        reject(error);
      });
  });
};

/*
 * Get Base64PNG from base64PDF for each page
 */
const convertEachBase64PdfPageToBase64PngPage = (pdf, currentPage) => {
  return new Promise((resolve, reject) => {
    pdf.getPage(currentPage).then((page) => {
      var scale = 1.5;
      var viewport = page.getViewport({ scale: scale });

      // Prepare canvas using PDF page dimensions
      var canvas = document.createElement('canvas');
      var context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      // Render PDF page into canvas context
      var renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      page
        .render(renderContext)
        .promise.then(() => {
          resolve(canvas.toDataURL()); // Returns the content of the current canvas as an image
        })
        .catch((error) => {
          reject(error);
        });
    });
  });
};

//#endregion

//#region Event listners

/**
 *
 */
document
  .getElementById('single-pdf-base64')
  .addEventListener('click', printSingleBase64Pdf);

/**
 *
 */
document
  .getElementById('multiple-image')
  .addEventListener('click', printMultipleImages);

/**
 *
 */
document
  .getElementById('single-html')
  .addEventListener('click', printSingleHtml);

/**
 *
 */
document
  .getElementById('multiple-pdf')
  .addEventListener('click', printMultipleBase64Pdfs);

//#endregion
