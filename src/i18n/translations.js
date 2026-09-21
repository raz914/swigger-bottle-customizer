/**
 * EN / NL translation dictionaries for the bottle configurator.
 *
 * Convention:  area.keyName
 *   area = component or logical section
 *   keyName = camelCase description
 *
 * Interpolation placeholders use {varName} syntax.
 */

const translations = {
    // =========================================================================
    // ENGLISH
    // =========================================================================
    en: {
        // -- Tabs / Navigation ------------------------------------------------
        'tab.front': 'Front',
        'tab.back': 'Back',
        'tab.frontPrice': '',
        'tab.backPrice': '',
        'common.back': 'Back',

        // -- Product info -----------------------------------------------------
        'product.heading': 'SWIGGER™',
        'product.colorLabel': 'Product color:',
        'product.colorLabelShort': 'Color:',

        // -- Color names ------------------------------------------------------
        'color.black': 'Black',
        'color.white': 'White',
        'color.blue': 'Blue',
        'color.red': 'Red',
        'color.selectAria': 'Select {color} color',
        'color.update': 'Update',
        'color.outOfStock': 'Out of stock',
        'color.onBackorder': 'On backorder',
        'color.chooseColor': 'Choose color',

        // -- Main view --------------------------------------------------------
        'main.heading': 'Design something unique',
        'main.uploadOwn': 'My own design',
        'main.text': 'Text',
        'main.monogram': 'Monogram',
        'main.jersey': 'Jersey',
        'main.valentines': 'Valentines',
        'main.gallery': 'Ready-to-go designs',

        // -- Jersey view ------------------------------------------------------
        'jersey.back': 'Back',
        'jersey.heading': 'Jersey style',
        'jersey.numberLabel': 'Number',
        'jersey.textLabel': 'Text',
        'jersey.numberPlaceholder': '00',
        'jersey.textPlaceholder': 'Name',
        'jersey.fontLabel': 'Jersey font',
        'jersey.sizeLabel': 'Size',
        'jersey.nameTileLabel': 'Name',

        // -- Bottom bar -------------------------------------------------------
        'bottomBar.remove': 'Remove',
        'bottomBar.review': 'Review',
        'bottomBar.preparing': 'Preparing...',

        // -- Text view --------------------------------------------------------
        'text.back': 'Back',
        'text.placeholder': 'Type text here',
        'text.orientationLabel': 'Orientation:',
        'text.vertical': 'Vertical',
        'text.horizontal': 'Horizontal',
        'text.verticalAria': 'Vertical text',
        'text.horizontalAria': 'Horizontal text',
        'text.fontLabel': 'Font:',
        'text.positionLabel': 'Vertical position',
        'text.positionTop': 'Top',
        'text.positionBottom': 'Bottom',
        'text.positionCenter': 'Center',

        // -- Monogram view ----------------------------------------------------
        'monogram.back': 'Back',
        'monogram.placeholderSingle': 'One letter',
        'monogram.placeholderMinTwo': 'Min. 2 letters',
        'monogram.placeholderDefault': 'Enter initials',
        'monogram.warnSingleLetter': 'Only first letter shown',
        'monogram.warnMinTwo': 'Enter at least 2 letters',
        'monogram.noteLabel': 'Note:',
        'monogram.noteText': 'Monograms with three initials display the last name in the center.',
        'monogram.styleLabel': 'Monogram:',

        // -- Gallery view -----------------------------------------------------
        'gallery.back': 'Back',
        'gallery.backToCategories': 'Back to categories',
        'gallery.selectedLabel': 'Selected: {name}',

        // -- Gallery categories -----------------------------------------------
        'gallery.cat.animals': 'Animals',
        'gallery.cat.symbols': 'Symbols',
        'gallery.cat.celebration': 'Celebration',
        'gallery.cat.family': 'Family',
        'gallery.cat.fan_favorites': 'Favorites',
        'gallery.cat.sports': 'Sports',
        'gallery.cat.zodiac': 'Zodiac',
        'gallery.cat.valentines': 'Valentines',
        'gallery.cat.emojis': 'Emojis',

        // -- Upload view ------------------------------------------------------
        'upload.back': 'Back',
        'upload.uploadFailed': 'Upload failed',
        'upload.errorPdf': 'Failed to render PDF preview.',
        'upload.errorAspectRatio': 'Image ratio is not optimal.',
        'upload.errorLoadImage': 'Failed to load image.',
        'upload.errorProcessing': 'Error processing file.',
        'upload.processing': 'Processing...',
        'upload.uploadDesign': 'Upload design',
        'upload.acceptedTypes': 'Accepted types: PNG, JPG, SVG, PDF',
        'upload.iconImageSize': 'Min. 300 px',
        'upload.iconNoTrademark': 'No trademarks',
        'upload.iconNoCopyright': 'No copyright',
        'upload.iconNoPhotos': 'No photos',
        'upload.instructionsHeading': 'Instructions',
        'upload.instruction1': 'Ensure high contrast for the best results on the bottle.',
        'upload.instruction2': 'Avoid shadows; sharp black-and-white designs work best.',
        'upload.instruction3': 'Check your preview carefully: what you see is what we engrave.',
        'upload.instruction4': 'We reserve the right to cancel orders with inappropriate content.',
        'upload.sizeLabel': 'Size',
        'upload.removeBg': 'Remove background',
        'upload.invert': 'Invert colors (White on black)',
        'upload.contrast': 'Contrast threshold',
        'upload.removeImage': 'Remove image',
        'upload.placementHint': 'Review your placement on the bottle.',
        'upload.previewAlt': 'Preview',

        // -- Review screen ----------------------------------------------------
        'review.addingToCart': 'Adding to cart...',
        'review.logoAlt': 'Logo',
        'review.frontPreviewAlt': 'Front preview',
        'review.backPreviewAlt': 'Back preview',
        'review.closeAria': 'Close review',
        'review.heading': 'Looking good!',
        'review.deliveryNotice': 'Take one last look at your masterpiece. Is everything correct? Then we\'re ready to start engraving.',
        'review.noPreview': 'No preview available',
        'review.editFront': 'Edit front',
        'review.editBack': 'Edit back',
        'review.footerNotice': 'Ready to start? Custom items cannot be returned.',
        'review.backButton': 'Back',
        'review.addToCart': 'Engrave it!',
        'review.adding': 'Processing...',
        'review.errorDefault': 'Failed to add to cart.',
        'review.successTitle': 'Success!',
        'review.successMessage': 'Product added to cart',

        // -- Confirmation modal -----------------------------------------------
        'confirm.heading': 'Almost there!',
        'confirm.body1': 'One last check: is the spelling correct and are you happy with your design? Since we\'re making this bottle specially for you, personalized items cannot be returned.',
        'confirm.body2': 'The preview is a digital representation; the actual engraving may vary slightly (but we\'ll make sure it looks stunning!).',
        'confirm.body3': 'By clicking accept, you confirm that you own the rights to the design and that everything is correct.',
        'confirm.body4': 'Let\'s create something beautiful!',
        'confirm.body5': '',
        'confirm.body6': '',
        'confirm.agreeLabel': 'I agree to these terms',
        'confirm.cancel': 'Back',
        'confirm.accept': 'Engrave it!',
        'confirm.quantity': 'Qty',
        'confirm.designMore': 'Add & Design Next',
        'confirm.addAndClose': 'Engrave it!',

        // -- Upload confirmation modal ----------------------------------------
        'uploadConfirm.heading': 'Review and accept to proceed:',
        'uploadConfirm.body1': 'By using our service, you agree to the following conditions regarding your custom content.',
        'uploadConfirm.repWarrantiesHeading': 'Ownership',
        'uploadConfirm.repWarrantiesBody': 'You confirm that you own the rights to the uploaded content and it does not violate any laws or third-party rights.',
        'uploadConfirm.liabilityHeading': 'Liability',
        'uploadConfirm.liabilityBody': 'We are not liable for the misuse of uploaded content or any indirect damages resulting from the service.',
        'uploadConfirm.indemnificationHeading': 'Indemnity',
        'uploadConfirm.indemnificationBody': 'You agree to indemnify us from any claims arising from your use of the service or your uploaded content.',
        'uploadConfirm.agreeLabel': 'I agree to these terms',
        'uploadConfirm.cancel': 'Cancel',
        'uploadConfirm.submit': 'Agree',

        // -- MiniNav ----------------------------------------------------------
        'miniNav.upload': 'Upload',
        'miniNav.text': 'Text',
        'miniNav.monogram': 'Monogram',
        'miniNav.gallery': 'Gallery',
        'miniNav.jersey': 'Jersey',

        // -- BottlePreview alt ------------------------------------------------
        'bottlePreview.alt': 'SWIGGER™ {side}',
        'bottlePreview.uploadedImageAlt': 'Uploaded image',

        // -- Loader -----------------------------------------------------------
        'loader.preparingDesign': 'Preparing your design...',
    },

    // =========================================================================
    // DUTCH (Nederlands)
    // =========================================================================
    nl: {
        // -- Tabs / Navigation ------------------------------------------------
        'tab.front': 'Voor',
        'tab.back': 'Achter',
        'tab.frontPrice': '',
        'tab.backPrice': '',
        'common.back': 'Terug',

        // -- Product info -----------------------------------------------------
        'product.heading': 'SWIGGER™',
        'product.colorLabel': 'Productkleur:',
        'product.colorLabelShort': 'Kleur:',

        // -- Color names ------------------------------------------------------
        'color.black': 'Zwart',
        'color.white': 'Wit',
        'color.blue': 'Blauw',
        'color.red': 'Rood',
        'color.selectAria': 'Selecteer kleur {color}',
        'color.update': 'Bijwerken',
        'color.outOfStock': 'Niet op voorraad',
        'color.onBackorder': 'Op nabestelling',
        'color.chooseColor': 'Kies kleur',

        // -- Main view --------------------------------------------------------
        'main.heading': 'Creëer jouw signature bottle',
        'main.uploadOwn': 'Eigen logo',
        'main.text': 'Eigen tekst',
        'main.monogram': 'Initialen',
        'main.jersey': 'Jersey',
        'main.valentines': 'Valentijn',
        'main.gallery': 'Premium designs',

        // -- Jersey view ------------------------------------------------------
        'jersey.back': 'Terug',
        'jersey.heading': 'Jersey stijl',
        'jersey.numberLabel': 'Nummer',
        'jersey.textLabel': 'Tekst',
        'jersey.numberPlaceholder': '00',
        'jersey.textPlaceholder': 'Naam',
        'jersey.fontLabel': 'Jersey lettertype',
        'jersey.sizeLabel': 'Grootte',
        'jersey.nameTileLabel': 'Naam',

        // -- Bottom bar -------------------------------------------------------
        'bottomBar.remove': 'Verwijderen',
        'bottomBar.review': 'Bekijken',
        'bottomBar.preparing': 'Voorbereiden...',

        // -- Text view --------------------------------------------------------
        'text.back': 'Terug',
        'text.placeholder': 'Typ hier je tekst',
        'text.orientationLabel': 'Oriëntatie:',
        'text.vertical': 'Verticaal',
        'text.horizontal': 'Horizontaal',
        'text.verticalAria': 'Verticale tekst',
        'text.horizontalAria': 'Horizontale tekst',
        'text.alignmentLabel': 'Uitlijning:',
        'text.center': 'Gecentreerd',
        'text.left': 'Links',
        'text.fontLabel': 'Lettertype:',
        'text.positionLabel': 'Verticale positie',
        'text.positionTop': 'Boven',
        'text.positionBottom': 'Onder',
        'text.positionCenter': 'Midden',

        // -- Monogram view ----------------------------------------------------
        'monogram.back': 'Terug',
        'monogram.placeholderSingle': 'Eén letter',
        'monogram.placeholderMinTwo': 'Min. 2 letters',
        'monogram.placeholderDefault': 'Voer initialen in',
        'monogram.warnSingleLetter': 'Alleen eerste letter getoond',
        'monogram.warnMinTwo': 'Minimaal 2 letters nodig',
        'monogram.noteLabel': 'Opmerking:',
        'monogram.noteText': 'Bij drie initialen staat de achternaam-initiaal in het midden.',
        'monogram.styleLabel': 'Monogram:',

        // -- Gallery view -----------------------------------------------------
        'gallery.back': 'Terug',
        'gallery.backToCategories': 'Terug naar categorieën',
        'gallery.selectedLabel': 'Geselecteerd: {name}',

        // -- Gallery categories -----------------------------------------------
        'gallery.cat.animals': 'Dieren',
        'gallery.cat.symbols': 'Symbolen',
        'gallery.cat.celebration': 'Feest',
        'gallery.cat.family': 'Familie',
        'gallery.cat.fan_favorites': 'Favorieten',
        'gallery.cat.sports': 'Sport',
        'gallery.cat.zodiac': 'Sterrenbeeld',
        'gallery.cat.valentines': 'Valentijn',
        'gallery.cat.emojis': "Emoji's",

        // -- Upload view ------------------------------------------------------
        'upload.back': 'Terug',
        'upload.uploadFailed': 'Upload mislukt',
        'upload.errorPdf': 'Kan PDF-voorbeeld niet laden.',
        'upload.errorAspectRatio': 'Beeldverhouding is niet optimaal.',
        'upload.errorLoadImage': 'Kan afbeelding niet laden.',
        'upload.errorProcessing': 'Fout bij verwerken.',
        'upload.processing': 'Verwerken...',
        'upload.uploadDesign': 'Ontwerp uploaden',
        'upload.acceptedTypes': 'Bestanden: PNG, JPG, SVG, PDF',
        'upload.iconImageSize': 'Min. 300 px',
        'upload.iconNoTrademark': 'Geen merken',
        'upload.iconNoCopyright': 'Geen copyright',
        'upload.iconNoPhotos': "Geen foto's",
        'upload.instructionsHeading': 'Zo haal je het beste resultaat:',
        'upload.instruction1': 'Zorg voor een scherp contrast, dan knalt je ontwerp echt van de fles af!',
        'upload.instruction2': 'Vermijd schaduwen; strakke zwart-wit ontwerpen werken het allermooist.',
        'upload.instruction3': 'Bekijk je voorbeeld goed: wat je hier ziet, is precies wat we gaan graveren.',
        'upload.instruction4': 'Wij behouden het recht om ongepaste ontwerpen te weigeren.',
        'upload.sizeLabel': 'Grootte',
        'upload.removeBg': 'Achtergrond verwijderen',
        'upload.invert': 'Kleur omkeren (Wit op zwart)',
        'upload.contrast': 'Contrast / Drempelwaarde',
        'upload.removeImage': 'Verwijder afbeelding',
        'upload.placementHint': 'Bekijk de plaatsing op het voorbeeld.',
        'upload.previewAlt': 'Voorbeeld',

        // -- Review screen ----------------------------------------------------
        'review.addingToCart': 'Wordt toegevoegd...',
        'review.logoAlt': 'Logo',
        'review.frontPreviewAlt': 'Voorbeeld voorzijde',
        'review.backPreviewAlt': 'Voorbeeld achterzijde',
        'review.closeAria': 'Sluit review',
        'review.heading': 'Is-ie zo perfect?',
        'review.deliveryNotice': 'Neem nog één keer de tijd om je meesterwerk te bewonderen. Klopt alles? Dan gaan we voor je aan de slag.',
        'review.noPreview': 'Geen voorbeeld beschikbaar',
        'review.editFront': 'Bewerk voorzijde',
        'review.editBack': 'Bewerk achterzijde',
        'review.footerNotice': 'Klaar voor de start?',
        'review.backButton': 'Terug',
        'review.addToCart': 'Graveren maar!',
        'review.adding': 'Wordt verwerkt...',
        'review.errorDefault': 'Kon niet toevoegen aan winkelwagen.',
        'review.successTitle': 'Gelukt!',
        'review.successMessage': 'Product toegevoegd aan winkelwagen',

        // -- Confirmation modal -----------------------------------------------
        'confirm.heading': 'Bijna klaar!',
        'confirm.body1': 'Nog even de laatste check: klopt de spelling en ben je blij met je ontwerp? Omdat we de fles speciaal voor jou maken, kunnen we deze helaas niet retour nemen.',
        'confirm.body2': 'Het voorbeeld is een digitale weergave; de echte gravure kan er soms een heel klein beetje anders uitzien (maar we maken hem natuurlijk prachtig!).',
        'confirm.body3': 'Door op accepteren te klikken bevestig je dat het ontwerp van jou is (of dat je toestemming hebt) en dat alles klopt.',
        'confirm.body4': 'We gaan er iets moois van maken!',
        'confirm.body5': '',
        'confirm.body6': '',
        'confirm.agreeLabel': 'Ja, ik ga akkoord',
        'confirm.cancel': 'Terug',
        'confirm.accept': 'Graveren Maar!',
        'confirm.quantity': 'Aantal',
        'confirm.designMore': 'Toevoegen & volgende ontwerpen',
        'confirm.addAndClose': 'Graveren Maar!',

        // -- Upload confirmation modal ----------------------------------------
        'uploadConfirm.heading': 'Klaar om te graveren?',
        'uploadConfirm.body1': 'We willen zeker weten dat je ontwerp helemaal goed op de fles komt te staan.',
        'uploadConfirm.repWarrantiesHeading': 'Jouw Ontwerp',
        'uploadConfirm.repWarrantiesBody': 'Je bevestigt dat dit jouw eigen ontwerp is (of dat je toestemming hebt) en dat het geen rechten van anderen schendt.',
        'uploadConfirm.liabilityHeading': 'Controle',
        'uploadConfirm.liabilityBody': 'Check je spelling en kwaliteit goed. Wat je in het voorbeeld ziet, is precies wat wij voor je gaan maken.',
        'uploadConfirm.indemnificationHeading': 'Akkoord',
        'uploadConfirm.indemnificationBody': 'Door verder te gaan, geef je ons toestemming om dit ontwerp op jouw fles te graveren.',
        'uploadConfirm.agreeLabel': 'Ja, ik ga akkoord',
        'uploadConfirm.cancel': 'Annuleren',
        'uploadConfirm.submit': 'Doorgaan',

        // -- MiniNav ----------------------------------------------------------
        'miniNav.upload': 'Upload',
        'miniNav.text': 'Tekst',
        'miniNav.monogram': 'Monogram',
        'miniNav.gallery': 'Galerij',
        'miniNav.jersey': 'Jersey',

        // -- BottlePreview alt ------------------------------------------------
        'bottlePreview.alt': 'SWIGGER™ {side}',
        'bottlePreview.uploadedImageAlt': 'Geüploade afbeelding',

        // -- Loader -----------------------------------------------------------
        'loader.preparingDesign': 'Ontwerp voorbereiden...',
    }
};

export default translations;
