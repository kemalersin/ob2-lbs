var express = require('express');
var router = express.Router();

var _ = require("lodash");
var async = require("async");
var math = require('mathjs');
var moment = require('moment');

const ORFICHE_FIELD_LIST = `
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
`;

const ORFLINE_FIELD_LIST = `
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
`;

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

router.post('/', async function (req, res, next) {
  var sql = req.app.get('sql');

  var order = req.body.order;
  var basket = req.body.basket;
  var logoFirm = process.env.LOGO_FIRM;
  var logoPeriod = process.env.LOGO_PERIOD;

  sql.connect({
    user: process.env.MSSQL_USER,
    password: process.env.MSSQL_PASSWORD,
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE
  }).then(async function () {
    var firm = await sql.query(
      `
        SELECT
          ISNULL(USEEARCHIVE, 0) AS USEEARCHIVE
        FROM
          L_CAPIFIRM WHERE NR=${logoFirm}
      `
    );

    var client = await sql.query(
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

    var logoOrder = await sql.query(
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
    );

    firm = firm.recordset[0];
    client = client.recordset[0];

    var EINVOICE, EINVOICETYP;

    var useEArchive = false;
    var isEArchiveClient = false;

    var orderTotal = 0;
    var orderVatAmount = 0;
    var orderDiscountTotal = 0;

    var clientRef = client.LOGICALREF;
    var tradingGrp = client.TRADINGGRP;

    var useEArchive = !!firm.USEEARCHIVE;
    var isEInvoiceClient = !!client.ACCEPTEINV;

    var isPerrCurr = client.ISPERCURR ? 1 : 0;

    var sendMod = client.SENDMOD;

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

    var orderNr = !logoOrder.rowsAffected[0] ?
      "000000001" :
      ("000000000" + ++logoOrder.recordset[0].FICHENO).slice(-9);

    await sql.query(
      `
        INSERT INTO
          LG_${logoFirm}_${logoPeriod}_ORFICHE
          (
            ${ORFICHE_FIELD_LIST}
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

    logoOrder = await sql.query(
      `
        SELECT
          LOGICALREF
        FROM
          LG_${logoFirm}_${logoPeriod}_ORFICHE
        WHERE
          FICHENO='${orderNr}'        
      `
    );

    var n = 0;
    var lineNo = 1;
    var orderRef = logoOrder.recordset[0].LOGICALREF;

    for (product of basket) {
      var amount = product.amount;
      var price = product.price;
      var vat = product.vat;
      var code = product.item.code;

      var item = await sql.query(
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
      )

      item = item.recordset[0];

      var stockRef = item.ITEMREF;
      var unitSetRef = item.UNITSETREF;
      var unitRef = item.UNITREF;

      var priceData = await sql.query(
        `
            SELECT
              TOP 1
                ROUND(
                  (
                    CASE
                      WHEN ISNULL(PR.PRICE, 0) = 0 THEN 0
                      WHEN PR.INCVAT=1 THEN PR.PRICE
                      ELSE
                        PR.PRICE * (1 + IT.SELLVAT / 100)
                    END
                  ),
                2) AS price,             
                IT.SELLVAT AS vat
            FROM
              LG_${logoFirm}_ITEMS AS IT,
              LG_${logoFirm}_CLCARD AS CL,
              LG_${logoFirm}_PRCLIST AS PR
            WHERE
              PR.ACTIVE=0 AND
              PR.PTYPE=2 AND
              PR.CARDREF=IT.LOGICALREF AND
              PR.CLSPECODE2=CL.SPECODE2 AND
              IT.LOGICALREF=${stockRef} AND
              CL.LOGICALREF=${clientRef}
            ORDER BY
              PR.PRIORITY
          `
      );

      if (priceData = priceData.recordset[0]) {
        price = priceData.price;
        vat = priceData.vat;
      }

      var priceExcVat = price ? price / (vat / 100 + 1) : 0;
      var lineTotal = priceExcVat * amount;      
      var vatAmount = lineTotal ? lineTotal / 100 * vat : 0;

      var lineDiscount = 0;

      await sql.query(
        `
          INSERT INTO
            LG_${logoFirm}_${logoPeriod}_ORFLINE
          (
            ${ORFLINE_FIELD_LIST}
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

      var campaigns = await sql.query(
        `
          SELECT
            CL.FORMULA AS formula
          FROM
            LG_${logoFirm}_CAMPAIGN AS CM,
            LG_${logoFirm}_CMPGNLINE AS CL
          WHERE 
            CM.ACTIVE=0 AND       
            CM.BEGDATE<=CONVERT(date, getdate()) AND
            CM.ENDDATE>=CONVERT(date, getdate()) AND          
            (N'' + CM.CLIENTCODE COLLATE Turkish_100_CI_AS)='${order.client.code}' AND                              
            (N'' + CL.CONDITEMCODE COLLATE Turkish_100_CI_AS)='${product.item.code.slice(0, 3)}*' AND
            CL.CAMPCARDREF=CM.LOGICALREF
          ORDER BY
            CL.LINENR  
        `
      );

      if (campaigns.recordset.length) {
        var parentLine = await sql.query(
          `
            SELECT
              LOGICALREF AS lineRef
            FROM
              LG_${logoFirm}_${logoPeriod}_ORFLINE
            WHERE
              ORDFICHEREF=${orderRef} AND
              LINENO_=${lineNo - 1}
          `
        );

        parentLine = parentLine.recordset[0];

        async.forEachOf(campaigns.recordset, function (campaign, key, callback) {
          campaign.formula = campaign.formula.replace(/P5/g, amount);
          campaign.formula = campaign.formula.replace(/P76/g, priceExcVat);
          campaign.formula = campaign.formula.replace(/P2/g, lineTotal);

          var campaignTotal = math.round(math.evaluate(campaign.formula), 2);
          var campaignRate = math.round(100 / (lineTotal / campaignTotal), 6);

          lineTotal -= campaignTotal;
          lineDiscount += campaignTotal;

          sql.query(
            `
            INSERT INTO
              LG_${logoFirm}_${logoPeriod}_ORFLINE
            (
              ${ORFLINE_FIELD_LIST}
            )
            VALUES (
              /*  1 */    0, ${orderRef}, ${clientRef}, 2, 0,
              /*  2 */    0, 0, ${lineNo++}, 1, '${getSQLDate(order.createdAt)}',
              /*  3 */    ${decodeTime(order.createdAt)}, 0, 0, 0, 0,
              /*  4 */    0, 0, 0, 0, 0,
              /*  5 */    0, 0, '', '', 0,
              /*  6 */    0, ${campaignTotal}, 0, ${campaignRate}, 0,
              /*  7 */    0, 0, 0, 0, 0,
              /*  8 */    0, '', 0, 0, 0,
              /*  9 */    0, 0, 0, 0, 0,
              /* 10 */    0, 0, 0, 0, 0,
              /* 11 */    0, '${getSQLDate(order.createdAt)}', 0, 0, 0,
              /* 12 */    0, 0, 0, 0, 0,
              /* 13 */    0, 0, 0, 0, 0,
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
              /* 31 */    0, 0, '', '${getSQLDate(order.createdAt)}', 0,
              /* 32 */    0, '', 0, 0, ${parentLine.lineRef}             
            )
          `
          ).then(() => callback());
        });

        vatAmount = lineTotal / 100 * vat;
        orderDiscountTotal += lineDiscount;

        await sql.query(
          `
            UPDATE
              LG_${logoFirm}_${logoPeriod}_ORFLINE
            SET
              DISTCOST=${lineDiscount},
              DISTDISC=${lineDiscount},
              VATAMNT=${vatAmount},
              LINENET=${lineTotal}
            WHERE
              LOGICALREF=${parentLine.lineRef} 
          `
        );
      }

      orderTotal += lineTotal;
      orderVatAmount += vatAmount;

      if (++n === basket.length) {
        sql.query(
          `
            UPDATE
              LG_${logoFirm}_${logoPeriod}_ORFICHE
            SET
              TOTALVAT=${math.round(orderVatAmount, 2)},
              GROSSTOTAL=${math.round(orderTotal + orderDiscountTotal, 2)},
              NETTOTAL=${math.round(orderTotal + orderVatAmount, 2)},
              TRNET=${math.round(orderTotal + orderVatAmount, 2)}
            WHERE
              LOGICALREF=${orderRef}
          `
        );
      }
    }

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
  })
    .catch(function (err) {
      next(err);
    });
});

module.exports = router;
