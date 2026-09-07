/*==========================================================
 FILE MANAGEMENT SYSTEM (FMS)
 Module      : CPGRAMS
 File        : cpgrams-repository.js
 Version     : 5.0
 Developer   : Lekha Technologies
 Description : CPGRAMS Repository
==========================================================*/

"use strict";

/*==========================================================
 COLLECTION
==========================================================*/

const COLLECTION_NAME = "cpgrams";

/*==========================================================
 REPOSITORY
==========================================================*/

class CPGramsRepository extends BaseRepository {

    constructor() {
        super(COLLECTION_NAME);
    }

    /*======================================================
      DUPLICATE CHECK
    ======================================================*/

    async grievanceExists(grievanceNumber) {

        try {

            const snapshot =
                await this.collection()
                    .where("grievanceNumber", "==", grievanceNumber)
                    .where("active", "==", true)
                    .limit(1)
                    .get();

            return snapshot.empty === false;

        }
        catch (error) {

            console.error(error);
            return false;

        }

    }

    /*======================================================
      SEARCH
    ======================================================*/

    async search(field, value) {

        return await this.query(field, value);

    }

    /*======================================================
      DASHBOARD SUMMARY
    ======================================================*/

    async getDashboardSummary() {

        const result =
            await this.getActiveRecords();

        if (!result.success)
            return result;

        const records = result.data;

        const summary = {

            total: records.length,
            pending: 0,
            disposed: 0,
            overdue: 0

        };

        const today = new Date();

        records.forEach(record => {

            const status =
                record.finalStatus || "";

            if (
                status === "Disposed" ||
                status === "Closed"
            ) {

                summary.disposed++;

            }
            else {

                summary.pending++;

            }

            if (
                record.dueDate &&
                status !== "Disposed" &&
                status !== "Closed"
            ) {

                const due =
                    new Date(record.dueDate);

                if (due < today) {

                    summary.overdue++;

                }

            }

        });

        return this.success(summary);

    }

}

/*==========================================================
 REPOSITORY INSTANCE
==========================================================*/

const repository =
    new CPGramsRepository();

/*==========================================================
 GLOBAL WRAPPERS
==========================================================*/

window.createRecord =
    data => repository.create(data);

window.updateRecord =
    (id, data) => repository.update(id, data);

window.deleteRecord =
    id => repository.delete(id);

window.getDocument =
    id => repository.get(id);

window.getActiveRecords =
    (limit) => repository.getActiveRecords(limit);

window.grievanceExists =
    number => repository.grievanceExists(number);

window.searchRecordsRepository =
    (field, value) => repository.search(field, value);

window.getDashboardSummary =
    () => repository.getDashboardSummary();