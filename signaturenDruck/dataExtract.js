class dataExtract {
    // returns the first 4 chars
    firstFour(str) {
        return str.substring(0, 4);
    }

    //extracts the PPN
    ppn(str) {
        // regex definiert 2 gruppen
        let regex = /^(\d{4}\s\s*)(.*)(\s*)$/;

        // es wird mit hilfe des regex die PPN ausgelesen
        return str.replace(regex, "$2");
    }

    // extracts the exNr
    exNr(str) {
        // regex definiert 2 gruppen
        let regex = /^(\d{4})(.*)$/;

        // es wird mit hilfe des regex die ExemplarNr ausgelesen
        return str.replace(regex, "$1");
    }

    // extracts the signature text
    txt(str) {
        // removes the first 4 numbers and following spaces
        let regex = /^(\d{4}\s\s*)(.*)(\s*)$/;
        str = str.replace(regex, "$2");

        // removes @ and everything that follows
        regex = /^(.[^@]*)(.*)$/;
        str = str.replace(regex, "$1");

        // removes leading and following whitespaces
        str = str.trim();


        let foundAt = str.indexOf("/");
        if (foundAt != -1) {
            let controlIndex = str.indexOf("!");
            if ((controlIndex != -1) && (controlIndex > foundAt)) {
                str = str.substr(foundAt+1);
            }
        }

        foundAt = str.indexOf("#");
        if (foundAt != -1) {
            str = str.substr(foundAt+1);
        }

        if (str.startsWith("$")) {
            foundAt = str.indexOf("$", 1);
            if (foundAt != -1) {
                str = str.substr(foundAt+1);
            }
        }

        // regex = /^((!\w*\s*\w*!\s*)*)(.*)(\s*)$/;
        // str = str.replace(regex, "$3");

        if (str.startsWith("!")) {
            foundAt = str.indexOf("!", 1);
            if (foundAt != -1) {
                str = str.substr(foundAt+1);
            }
        }

        return str;
    }

    // extracts the date
    date(str) {
        // regex definiert 3 gruppen
        let regex = /^(\d{4}\s\s*)(\d{2}-\d{2}-\d{2})(.*)$/;

        // es wird mit hilfe des regex das BearbeitetAm Datum ausgelesen
        return str.replace(regex, "$2");
    }
}

module.exports = dataExtract;