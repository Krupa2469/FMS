/*==========================================================
 STORAGE SERVICE
==========================================================*/

async function uploadFileToStorage(file, grievanceId) {

    try {

        const fileName =
            Date.now() + "_" + file.name;

        const storagePath =
            "attachments/" +
            grievanceId +
            "/" +
            fileName;

        const storageRef =
            storage.ref(storagePath);

        const snapshot =
            await storageRef.put(file);

        const downloadURL =
            await snapshot.ref.getDownloadURL();

        return {

            success: true,

            url: downloadURL,

            path: storagePath

        };

    }
    catch (error) {

        console.error(error);

        return {

            success: false,

            message: error.message

        };

    }

}

window.uploadFileToStorage =
    uploadFileToStorage;