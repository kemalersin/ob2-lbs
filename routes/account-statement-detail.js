var express = require('express');
var router = express.Router();

var sql = require('mssql');

router.get('/:ficheId', function (req, res, next) {
  var sql = req.app.get('sql');

  var logoFirm = process.env.LOGO_FIRM;
  var logoPeriod = process.env.LOGO_PERIOD;  

  var ficheId = req.params.ficheId;

  sql.query(
    `
        SELECT
            it.CODE AS code,
            it.NAME AS description,
            ln.AMOUNT AS amount,            
            ln.PRICE AS price,                        
            ln.DISTDISC AS discount,
            ln.VATAMNT AS vatAmount,
            ln.VATMATRAH + ln.VATAMNT AS total
        FROM
            LG_${logoFirm}_ITEMS it, 
            LG_${logoFirm}_UNITSETL ul, 
            LG_${logoFirm}_${logoPeriod}_STLINE ln
        WHERE
            ln.LINETYPE=0 AND
            ul.LOGICALREF=ln.UOMREF AND
            it.LOGICALREF=ln.STOCKREF AND
            ln.INVOICEREF=${ficheId}
        ORDER BY
            INVOICELNNO
    `
  ).then(function (detail) {
    res.send(detail.recordset);
  })
  .catch(function (err) {
    next(err);
  });  
});

module.exports = router;
