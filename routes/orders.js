var express = require('express');
var router = express.Router();

var sql = require('mssql');
var async = require("async");
var moment = require('moment');

function getSQLDate(date, short) {
  var formatStr = short ? 'YYYY-MM-DD 00:00:00.000' : 'YYYY-MM-DD HH:mm:ss.SSS';
  return moment(date).format(formatStr);
}

function decodeTime(date) {
  var mDate = moment(date);

  return mDate.millisecond() + 256 *
    mDate.second() + 65536 *
    mDate.minute() + 16777216 *
    mDate.hour();
}

router.post('/', function (req, res, next) {
  var sql = req.app.get('sql');

  var order = req.body.order;
  var basket = req.body.basket;
  var logoFirm = process.env.LOGO_FIRM;
  var logoPeriod = process.env.LOGO_PERIOD;

  var clientRef, orderRef, orderNr, tradingGrp, isEInvoiceClient, isPerrCurr, sendMod;

  var EINVOICE, EINVOICETYP;

  var useEArchive = false;
  var isEArchiveClient = false;

  var orderTotal = 0;
  var orderVatAmount = 0;

  //return res.send();

  sql.query(
    `
        SELECT
          ISNULL(USEEARCHIVE, 0) AS USEEARCHIVE
        FROM
          L_CAPIFIRM WHERE NR=${logoFirm}
      `

  ).then(function (firm) {
    useEArchive = !!firm.recordset[0].USEEARCHIVE;

    return sql.query(
      `
        SELECT
          LOGICALREF,
          TRADINGGRP,
          ISNULL(ACCEPTEINV, 0) AS ACCEPTEINV,
          ISNULL(ISPERCURR, 0) AS ISPERCURR,
          ISNULL(SENDMOD, 1) AS SENDMOD 
        FROM
          LG_${logoFirm}_CLCARD
        WHERE
          (N'' + CODE COLLATE Turkish_100_CI_AS)='${order.client.code}'
      `
    );
  }).then(function (client) {
    client = client.recordset[0];

    clientRef = client.LOGICALREF;
    tradingGrp = client.TRADINGGRP;

    isEInvoiceClient = !!client.ACCEPTEINV;

    isPerrCurr = client.ISPERCURR ? 1 : 0;

    sendMod = client.SENDMOD;

    if (useEArchive && !isEInvoiceClient) {
      isEArchiveClient = true;
    }

    EINVOICETYP = (isEInvoiceClient || isEArchiveClient) ?
      '0' : 'NULL';

    if (isEInvoiceClient) {
      EINVOICE = 1
    }
    else if (isEArchiveClient) {
      EINVOICE = 2
    }
    else {
      EINVOICE = 255;
    }

    return sql.query(
      `
        SELECT
          TOP 1 FICHENO
        FROM
          LG_${logoFirm}_${logoPeriod}_ORFICHE
        WHERE
          FICHENO LIKE '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]'
        ORDER BY
          FICHENO DESC
      `
    )
  }).then(function (logoOrder) {
    orderNr = !logoOrder.rowsAffected[0] ?
      "000000001" :
      ("000000000" + ++logoOrder.recordset[0].FICHENO).slice(-9);

    return sql.query(
      `
        INSERT INTO
          LG_${logoFirm}_${logoPeriod}_ORFICHE
          (
            /*  1 */    TRCODE, FICHENO, DATE_, TIME_, DOCODE,
            /*  2 */    SPECODE, CYPHCODE, CLIENTREF, RECVREF, ACCOUNTREF,
            /*  3 */    CENTERREF, SOURCEINDEX, SOURCECOSTGRP, UPDCURR, ADDDISCOUNTS,
            /*  4 */    TOTALDISCOUNTS, TOTALDISCOUNTED, ADDEXPENSES, TOTALEXPENSES, TOTALPROMOTIONS,
            /*  5 */    TOTALVAT, GROSSTOTAL, NETTOTAL, REPORTRATE, REPORTNET,
            /*  6 */    GENEXP1, GENEXP2, GENEXP3, GENEXP4, EXTENREF,
            /*  7 */    PAYDEFREF, PRINTCNT, BRANCH, DEPARTMENT, STATUS,
            /*  8 */    CAPIBLOCK_CREATEDBY, CAPIBLOCK_CREADEDDATE, CAPIBLOCK_CREATEDHOUR, CAPIBLOCK_CREATEDMIN, CAPIBLOCK_CREATEDSEC,
            /*  9 */    CAPIBLOCK_MODIFIEDBY, CAPIBLOCK_MODIFIEDDATE, CAPIBLOCK_MODIFIEDHOUR, CAPIBLOCK_MODIFIEDMIN, CAPIBLOCK_MODIFIEDSEC,
            /* 10 */    SALESMANREF, SHPTYPCOD, SHPAGNCOD, GENEXCTYP, LINEEXCTYP,
            /* 11 */    TRADINGGRP, TEXTINC, SITEID, RECSTATUS, ORGLOGICREF,
            /* 12 */    FACTORYNR, WFSTATUS, SHIPINFOREF, CUSTORDNO, SENDCNT,
            /* 13 */    DLVCLIENT, DOCTRACKINGNR, CANCELLED, ORGLOGOID, OFFERREF,
            /* 14 */    OFFALTREF, TYP, ALTNR, ADVANCEPAYM, TRCURR,
            /* 15 */    TRRATE, TRNET, PAYMENTTYPE, ONLYONEPAYLINE, OPSTAT,
            /* 16 */    WITHPAYTRANS, PROJECTREF, WFLOWCRDREF, UPDTRCURR, AFFECTCOLLATRL,
            /* 17 */    POFFERBEGDT, POFFERENDDT, REVISNR, LASTREVISION, CHECKAMOUNT,
            /* 18 */    SLSOPPRREF, SLSACTREF, SLSCUSTREF, AFFECTRISK, TOTALADDTAX,
            /* 19 */    TOTALEXADDTAX, APPROVE, APPROVEDATE, CHECKPRICE, TRANSFERWITHPAY,
            /* 20 */    FCSTATUSREF, CHECKTOTAL, GUID, CANTCREDEDUCT, DEDUCTIONPART1,
            /* 21 */    DEDUCTIONPART2, GLOBALID, DEFAULTFICHE, LEASINGREF, CAMPAIGNCODE,
            /* 22 */    ADDEXPENSESVAT, TOTALEXPENSESVAT, DEVIR, PRINTDATE, DELIVERYCODE,
            /* 23 */    GENEXP6, GENEXP5, EINVOICETYP, ATAXEXCEPTCODE, VATEXCEPTREASON,
            /* 24 */    TAXFREECHX, ATAXEXCEPTREASON, VATEXCEPTCODE, PUBLICBNACCREF, EINVOICE,
            /* 25 */    INSTEADOFDESP, ACCEPTEINVPUBLIC
          )
          VALUES (
            /*  1 */    1, '${orderNr}', '${getSQLDate(order.createdAt)}', ${decodeTime(order.createdAt)}, '',
            /*  2 */    '', '', ${clientRef}, 0, 0,
            /*  3 */    0, 0, 0, 0, 0,
            /*  4 */    0, 0, 0, 0, 0,
            /*  5 */    0, 0, 0, 0, 0,
            /*  6 */    '${order.notes.substring(0, 50)}', '${order.notes.substring(50, 100)}', '${order.notes.substring(100, 150)}', '${order.notes.substring(150, 200)}', 0,
            /*  7 */    0, 0, 0, 0, 4,
            /*  8 */    1, GETDATE(), DATEPART(HOUR, GETDATE()), DATEPART(MINUTE, GETDATE()), DATEPART(SECOND, GETDATE()),
            /*  9 */    0, NULL, 0, 0, 0,
            /* 10 */    0, '', '', 2, 4,
            /* 11 */    '${tradingGrp}', 0, 0, 1, 0,
            /* 12 */    0, 0, 0, '', 0,
            /* 13 */    0, '${order.orderNr}', 0, '', 0,
            /* 14 */    0, 0, 0, 0, 0,
            /* 15 */    0, 0, 0, 0, 0,
            /* 16 */    0, 0, 0, 0, 0,
            /* 17 */    NULL, NULL, '', 0, 0,
            /* 18 */    0, 0, 0, 0, 0,
            /* 19 */    0, 0, NULL, 0, 0,
            /* 20 */    0, 0, '', 0, 0,
            /* 21 */    0, NULL, 0, 0, '',
            /* 22 */    0, 0, 0, NULL, '',
            /* 23 */    '', '', ${EINVOICETYP}, '', '',
            /* 24 */    0, '', '', 0, ${EINVOICE},
            /* 25 */    1, 0
          )
      `
    );
  }).then(function () {
    return sql.query(
      `
        SELECT
          LOGICALREF
        FROM
          LG_${logoFirm}_${logoPeriod}_ORFICHE
        WHERE
          FICHENO='${orderNr}'        
      `
    );
  }).then(function (logoOrder) {
    orderRef = logoOrder.recordset[0].LOGICALREF;

    async.forEachOf(basket, function (value, key, callback) {
      var amount = value.amount;
      var price = value.price;
      var vat = value.vat;
      var code = value.item.code;

      var priceExcVat = price ? price / (vat / 100 + 1) : 0;
      var lineTotal = priceExcVat * amount;
      var vatAmount = lineTotal ? lineTotal / 100 * vat : 0;

      var lineNo = 1;

      orderTotal += lineTotal;
      orderVatAmount += vatAmount;

      sql.query(
        `
          SELECT
            ITEMS.LOGICALREF AS ITEMREF,
            ITEMS.UNITSETREF AS UNITSETREF,
            UNITS.LOGICALREF AS UNITREF
          FROM
            LG_${logoFirm}_ITEMS AS ITEMS,
            LG_${logoFirm}_UNITSETL AS UNITS
          WHERE
            UNITS.MAINUNIT=1 AND
            UNITS.UNITSETREF=ITEMS.UNITSETREF AND
            (N'' + ITEMS.CODE COLLATE Turkish_100_CI_AS)='${code}'
        `
      ).then(function (item) {
        item = item.recordset[0];

        var stockRef = item.ITEMREF;
        var unitSetRef = item.UNITSETREF;
        var unitRef = item.UNITREF;

        sql.query(
          `
            INSERT INTO
              LG_${logoFirm}_${logoPeriod}_ORFLINE
            (
              /*  1 */    STOCKREF, ORDFICHEREF, CLIENTREF, LINETYPE, PREVLINEREF,
              /*  2 */    PREVLINENO, DETLINE, LINENO_, TRCODE, DATE_,
              /*  3 */    TIME_, GLOBTRANS, CALCTYPE, CENTERREF, ACCOUNTREF,
              /*  4 */    VATACCREF, VATCENTERREF, PRACCREF, PRCENTERREF, PRVATACCREF,
              /*  5 */    PRVATCENREF, PROMREF, SPECODE, DELVRYCODE, AMOUNT,
              /*  6 */    PRICE, TOTAL, SHIPPEDAMOUNT, DISCPER, DISTCOST,
              /*  7 */    DISTDISC, DISTEXP, DISTPROM, VAT, VATAMNT,
              /*  8 */    VATMATRAH, LINEEXP, UOMREF, USREF, UINFO1,
              /*  9 */    UINFO2, UINFO3, UINFO4, UINFO5, UINFO6,
              /* 10 */    UINFO7, UINFO8, VATINC, CLOSED, DORESERVE,
              /* 11 */    INUSE, DUEDATE, PRCURR, PRPRICE, REPORTRATE,
              /* 12 */    BILLEDITEM, PAYDEFREF, EXTENREF, CPSTFLAG, SOURCEINDEX,
              /* 13 */    SOURCECOSTGRP, BRANCH, DEPARTMENT, LINENET, SALESMANREF,
              /* 14 */    STATUS, DREF, TRGFLAG, SITEID, RECSTATUS,
              /* 15 */    ORGLOGICREF, FACTORYNR, WFSTATUS, NETDISCFLAG, NETDISCPERC,
              /* 16 */    NETDISCAMNT, CONDITIONREF, DISTRESERVED, ONVEHICLE, CAMPAIGNREFS1,
              /* 17 */    CAMPAIGNREFS2, CAMPAIGNREFS3, CAMPAIGNREFS4, CAMPAIGNREFS5, POINTCAMPREF,
              /* 18 */    CAMPPOINT, PROMCLASITEMREF, REASONFORNOTSHP, CMPGLINEREF, PRRATE,
              /* 19 */    GROSSUINFO1, GROSSUINFO2, CANCELLED, DEMPEGGEDAMNT, TEXTINC,
              /* 20 */    OFFERREF, ORDERPARAM, ITEMASGREF, EXIMAMOUNT, OFFTRANSREF,
              /* 21 */    ORDEREDAMOUNT, ORGLOGOID, TRCURR, TRRATE, WITHPAYTRANS,
              /* 22 */    PROJECTREF, POINTCAMPREFS1, POINTCAMPREFS2, POINTCAMPREFS3, POINTCAMPREFS4,
              /* 23 */    CAMPPOINTS1, CAMPPOINTS2, CAMPPOINTS3, CAMPPOINTS4, CMPGLINEREFS1,
              /* 24 */    CMPGLINEREFS2, CMPGLINEREFS3, CMPGLINEREFS4, PRCLISTREF, AFFECTCOLLATRL,
              /* 25 */    FCTYP, PURCHOFFNR, DEMFICHEREF, DEMTRANSREF, ALTPROMFLAG,
              /* 26 */    VARIANTREF, REFLVATACCREF, REFLVATOTHACCREF, PRIORITY, AFFECTRISK,
              /* 27 */    BOMREF, BOMREVREF, ROUTINGREF, OPERATIONREF, WSREF,
              /* 28 */    ADDTAXRATE, ADDTAXCONVFACT, ADDTAXAMOUNT, ADDTAXACCREF, ADDTAXCENTERREF,
              /* 29 */    ADDTAXAMNTISUPD, ADDTAXDISCAMOUNT, EXADDTAXRATE, EXADDTAXCONVF, EXADDTAXAMNT,
              /* 30 */    EUVATSTATUS, ADDTAXVATMATRAH, CAMPPAYDEFREF, RPRICE, ORGDUEDATE,
              /* 31 */    ORGAMOUNT, ORGPRICE, SPECODE2, RESERVEDATE, CANDEDUCT,
              /* 32 */    UNDERDEDUCTLIMIT, GLOBALID, DEDUCTIONPART1, DEDUCTIONPART2, PARENTLNREF
            )
            VALUES (
              /*  1 */    ${stockRef}, ${orderRef}, ${clientRef}, 0, 0,
              /*  2 */    0, 0, ${lineNo++}, 1, '${getSQLDate(order.createdAt)}',
              /*  3 */    ${decodeTime(order.createdAt)}, 0, 0, 0, 0,
              /*  4 */    0, 0, 0, 0, 0,
              /*  5 */    0, 0, '', '', ${amount},
              /*  6 */    ${priceExcVat}, ${lineTotal}, 0, 0, 0,
              /*  7 */    0, 0, 0, ${vat}, ${vatAmount},
              /*  8 */    ${lineTotal}, '', ${unitRef}, ${unitSetRef}, ${amount},
              /*  9 */    ${amount}, 0, 0, 0, 0,
              /* 10 */    0, 0, 0, 0, 1, /* DORESERVE */
              /* 11 */    0, '${getSQLDate(order.createdAt)}', 0, 0, 0,
              /* 12 */    0, 0, 0, 0, 0,
              /* 13 */    0, 0, 0, ${lineTotal}, 0,
              /* 14 */    4, 0, 0, 0, 1,
              /* 15 */    0, 0, 0, 0, 0,
              /* 16 */    0, 0, 0, 0, 0,
              /* 17 */    0, 0, 0, 0, 0,
              /* 18 */    0, 0, 0, 0, 0,
              /* 19 */    0, 0, 0, 0, 0,
              /* 20 */    0, 0, 0, 0, 0,
              /* 21 */    0, '', 0, 0, 0,
              /* 22 */    0, 0, 0, 0, 0,
              /* 23 */    0, 0, 0, 0, 0,
              /* 24 */    0, 0, 0, 0, 0,
              /* 25 */    0, 0, 0, 0, 0,
              /* 26 */    0, 0, 0, 0, 1,
              /* 27 */    0, 0, 0, 0, 0,
              /* 28 */    0, 0, 0, 0, 0,
              /* 29 */    0, 0, 0, 0, 0,
              /* 30 */    0, 0, 0, 0, '${getSQLDate(order.createdAt)}',
              /* 31 */    ${amount}, ${priceExcVat}, '', '${getSQLDate(order.createdAt)}', 0,
              /* 32 */    0, '', 0, 0, 0             
            )
          `
        );

        callback();
      });
    });

    sql.query(
      `
        UPDATE
          LG_${logoFirm}_${logoPeriod}_ORFICHE
        SET
          TOTALVAT=${orderVatAmount},
          GROSSTOTAL=${orderTotal},
          NETTOTAL=${orderTotal + orderVatAmount},
          TRNET=${orderTotal + orderVatAmount}
        WHERE
          LOGICALREF=${orderRef}
      `
    );

    if (isEArchiveClient) {
      intPaymentDate =
        moment(order.createdAt).day() + 256 *
        moment(order.createdAt).month() + 65536 *
        moment(order.createdAt).year();

      sql.query(
        `
          INSERT INTO
            LG_${logoFirm}_${logoPeriod}_EARCHIVEDET
          (
            /*  1 */    INVOICEREF, INSTALLMENTNUMBER, EARCHIVESTATUS, SENDMOD, INTSALESADDR,  
            /*  2 */    INTPAYMENTDESC, INTPAYMENTTYPE, INTPAYMENTAGENT, INTPAYMENTDATE, OCKSERIALNUMBER,
            /*  3 */    OCKZNUMBER, OCKFICHENUMBER, OCKFICHEDATE, STFREF, ISCOMP,
            /*  4 */    TAXNR, TCKNO, NAME, SURNAME, DEFINITION_,
            /*  5 */    ADDR1, ADDR2, CITYCODE, CITY, COUNTRYCODE,
            /*  6 */    COUNTRY, POSTCODE, DISTRICTCODE, DISTRICT, TOWNCODE,
            /*  7 */    TOWN, EMAILADDR, ISPERCURR, INSTEADOFDESP, TAXOFFICE,
            /*  8 */    TELCODES1, TELCODES2, TELNRS1, TELNRS2, OLDEARCHIVESTATUS,
            /*  9 */    PLATENUM3, CHASSISNUM1, PLATENUM1, PLATENUM2, CHASSISNUM2,
            /* 10 */    RESPONSESTATUS, STATUSDESC, CHASSISNUM3, RESPONSECODE, DRIVERNAME3,
            /* 11 */    DRIVERSURNAME1, DRIVERNAME1, DRIVERNAME2, DRIVERSURNAME2, DRIVERTCKNO2,
            /* 12 */    DRIVERTCKNO3, DRIVERSURNAME3, DRIVERTCKNO1, ORDFCREF            
          )
          VALUES (
            /*  1 */    0, '', 0, ${sendMod}, '',  
            /*  2 */    '', 4, '', ${intPaymentDate}, '',
            /*  3 */    '', '', 0, 0, 0,
            /*  4 */    '', '', '', '', '',
            /*  5 */    '', '', '', '', '',
            /*  6 */    '', '', '', '', '',
            /*  7 */    '', '', ${isPerrCurr}, 1, '',
            /*  8 */    '', '', '', '', 0,
            /*  9 */    '', '', '', '', '',
            /* 10 */    0, '', '', 0, '',
            /* 11 */    '', '', '', '', '',
            /* 12 */    '', '', '', ${orderRef}            
          )
        `
      );
    }

    res.send({
      orderRef
    });
  });
});

module.exports = router;
