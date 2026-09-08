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

    normalizeGrievanceNumber(value) {
        return String(value ?? "")
            .trim()
            .toUpperCase()
            .replace(/\s+/g, "");
    }

    async grievanceExists(grievanceNumber, excludeId = null) {
        try {
            const normalized = this.normalizeGrievanceNumber(grievanceNumber);
            if (!normalized) return false;

            // Read the active register and compare normalized values so that
            // accidental spaces/case differences cannot create duplicates.
            const snapshot = await this.collection().get();
            return snapshot.docs.some(doc => {
                if (excludeId && doc.id === excludeId) return false;
                const data = doc.data() || {};
                if (data.active === false) return false;
                const existing = data.grievanceNumberNormalized || this.normalizeGrievanceNumber(data.grievanceNumber);
                return existing === normalized;
            });
        } catch (error) {
            console.error("CPGRAMS duplicate check failed:", error);
            throw error;
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
    (number, excludeId) => repository.grievanceExists(number, excludeId);

window.searchRecordsRepository =
    (field, value) => repository.search(field, value);

window.getDashboardSummary =
    () => repository.getDashboardSummary();