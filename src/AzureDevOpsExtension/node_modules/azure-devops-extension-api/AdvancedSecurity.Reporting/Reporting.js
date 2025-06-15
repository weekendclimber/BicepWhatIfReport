/*
 * ---------------------------------------------------------
 * Copyright(C) Microsoft Corporation. All rights reserved.
 * ---------------------------------------------------------
 */
define(["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var AlertType;
    (function (AlertType) {
        /**
         * The code has an unspecified vulnerability type
         */
        AlertType[AlertType["Unknown"] = 0] = "Unknown";
        /**
         * The code uses a dependency with a known vulnerability.
         */
        AlertType[AlertType["Dependency"] = 1] = "Dependency";
        /**
         * The code contains a secret that has now been compromised and must be revoked.
         */
        AlertType[AlertType["Secret"] = 2] = "Secret";
        /**
         * The code contains a weakness determined by static analysis.
         */
        AlertType[AlertType["Code"] = 3] = "Code";
        /**
         * The code uses a dependency with potential license incompliance.
         */
        AlertType[AlertType["License"] = 4] = "License";
    })(AlertType = exports.AlertType || (exports.AlertType = {}));
    var Severity;
    (function (Severity) {
        Severity[Severity["Low"] = 0] = "Low";
        Severity[Severity["Medium"] = 1] = "Medium";
        Severity[Severity["High"] = 2] = "High";
        Severity[Severity["Critical"] = 3] = "Critical";
        Severity[Severity["Note"] = 4] = "Note";
        Severity[Severity["Warning"] = 5] = "Warning";
        Severity[Severity["Error"] = 6] = "Error";
        Severity[Severity["Undefined"] = 7] = "Undefined";
    })(Severity = exports.Severity || (exports.Severity = {}));
    var TimePeriod;
    (function (TimePeriod) {
        TimePeriod[TimePeriod["Undefined"] = 0] = "Undefined";
        TimePeriod[TimePeriod["Last24Hours"] = 5] = "Last24Hours";
        TimePeriod[TimePeriod["Last7Days"] = 6] = "Last7Days";
        TimePeriod[TimePeriod["Last14Days"] = 7] = "Last14Days";
        TimePeriod[TimePeriod["Last30Days"] = 8] = "Last30Days";
        TimePeriod[TimePeriod["Last90Days"] = 9] = "Last90Days";
    })(TimePeriod = exports.TimePeriod || (exports.TimePeriod = {}));
});
