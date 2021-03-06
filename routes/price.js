var _ = require('lodash');
var math = require('mathjs');
var express = require('express');

var router = express.Router();

router.get('/', function (req, res, next) {
    var itemCode = req.query.itemCode;
    var clientCode = req.query.clientCode;
    var amount = +req.query.amount;

    var sql = req.app.get('sql');

    var logoFirm = process.env.LOGO_FIRM;

    sql.query(
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
              IT.SELLVAT AS vat,
              'TRY' AS currency
            FROM
              LG_${logoFirm}_ITEMS AS IT,
              LG_${logoFirm}_CLCARD AS CL,
              LG_${logoFirm}_PRCLIST AS PR
            WHERE
              PR.ACTIVE=0 AND
              PR.PTYPE=2 AND
              PR.CARDREF=IT.LOGICALREF AND
              PR.CLSPECODE2=CL.SPECODE2 AND
              (N'' + IT.CODE COLLATE Turkish_100_CI_AS)='${itemCode}' AND
              (N'' + CL.CODE COLLATE Turkish_100_CI_AS)='${clientCode}'
            ORDER BY
              PR.PRIORITY
          `

    ).then(function (priceData) {
        sql.query(
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
                  (N'' + CM.CLIENTCODE COLLATE Turkish_100_CI_AS)='${clientCode}' AND                              
                  (N'' + CL.CONDITEMCODE COLLATE Turkish_100_CI_AS)='${itemCode.slice(0, 3)}*' AND
                  CL.CAMPCARDREF=CM.LOGICALREF
                ORDER BY
                  CL.LINENR

            `
        ).then(function (campaigns) {
            priceData = priceData.recordset[0];

            var vatRate = (1 + priceData.vat / 100);
            var vatExcPrice = priceData.price / vatRate;

            var total = vatExcPrice * amount;

            _.forEach(campaigns.recordset, function (campaign) {
                campaign.formula = campaign.formula.replace(/P5/g, amount);
                campaign.formula = campaign.formula.replace(/P76/g, vatExcPrice);
                campaign.formula = campaign.formula.replace(/P2/g, total);

                total -= math.round(math.evaluate(campaign.formula), 2);
            });

            priceData.price = math.round(total / amount * vatRate, 4);

            res.send(priceData);
        });
    });
});

module.exports = router;