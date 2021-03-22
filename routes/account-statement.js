var express = require('express');
var router = express.Router();

var sql = require('mssql');

router.get('/:clientCode', function (req, res, next) {
  var sql = req.app.get('sql');

  var logoFirm = process.env.LOGO_FIRM;
  var logoPeriod = process.env.LOGO_PERIOD;  

  var clientCode = req.params.clientCode;

  sql.query(
    `
      SELECT
        CLF.SOURCEFREF AS id,
        CLF.DATE_ AS date,          
        (
            CASE
                WHEN CLF.TRCODE IN (31,32,33,36,37,38) THEN (
                    SELECT
                        INV.FICHENO
                    FROM
                        LG_${logoFirm}_${logoPeriod}_INVOICE INV
                    WHERE
                        INV.LOGICALREF=CLF.SOURCEFREF
                )
                ELSE CLF.TRANNO
            END 
        ) AS ficheNr,
        (
            CASE CLF.TRCODE
                WHEN 1 THEN 'Nakit Tahsilat'
                WHEN 2 THEN 'Nakit Ödeme'
                WHEN 3 THEN 'Borç Dekontu'
                WHEN 4 THEN 'Alacak Dekontu'
                WHEN 5 THEN 'Virman İşlemi'
                WHEN 6 THEN 'Kur Farkı İşlemi'
                WHEN 12 THEN 'Özel İşlem'
                WHEN 14 THEN 'Devir Fişi'
                WHEN 20 THEN 'Gelen Havaleler'
                WHEN 21 THEN 'Gön. Havaleler'
                WHEN 31 THEN 'Mal Alım Faturası'
                WHEN 32 THEN 'Perakende Satış İade Faturası'
                WHEN 33 THEN 'Toptan Satış İade Faturası'
                WHEN 34 THEN 'Alınan Hizmet Faturası'
                WHEN 35 THEN 'Alınan Proforma Faturası'
                WHEN 36 THEN 'Alım İade Faturası'
                WHEN 37 THEN 'Perakende Satış Faturası'
                WHEN 38 THEN 'Toptan Satış Faturası'
                WHEN 39 THEN 'Verilen Hizmet Faturası'
                WHEN 40 THEN 'Verilen Proforma Faturası'
                WHEN 41 THEN 'Verilen Vade Farkı Faturası'
                WHEN 42 THEN 'Verilen Vade Farkı Faturası'
                WHEN 43 THEN 'Alınan Fiyat Farkı Faturası'
                WHEN 44 THEN 'Verilen Fiyat Farkı Faturası'
                WHEN 45 THEN 'Verilen Serbest Meslek Makbuzu'
                WHEN 46 THEN 'Alınan Serbest Meslek Makbuzu'
                WHEN 56 THEN 'Müstahsil Makbuzu'
                WHEN 61 THEN 'Çek Girişi'
                WHEN 62 THEN 'Senet Girişi'
                WHEN 63 THEN 'Çek Çıkışı'
                WHEN 64 THEN 'Senet Çıkışı'
                WHEN 70 THEN 'Kredi Kartı Fişi'                                       
                ELSE ''
            END                    
        ) AS ficheType,
        CLF.TRNET * (CASE WHEN CLF.TRRATE=0 THEN 1 ELSE CLF.TRRATE END) AS total,        
        CAST(CLF.SIGN AS bit) AS credited,
        CAST((
            CASE
                WHEN CLF.TRCODE IN (31,32,33,36,37,38) THEN 1
                ELSE 0 
            END 
        ) AS bit) AS detailed
      FROM
          LG_${logoFirm}_CLCARD AS CL,                                            
          LG_${logoFirm}_${logoPeriod}_CLFLINE AS CLF
      WHERE
          CLF.CANCELLED=0 AND
          (N'' + CL.CODE COLLATE Turkish_100_CI_AS)='${clientCode}' AND
          CLF.CLIENTREF=CL.LOGICALREF                                                                                            
      ORDER BY
          CLF.DATE_,
          CLF.FTIME    
    `
  ).then(function (statement) {
    res.send(statement.recordset);
  })
  .catch(function (err) {
    next(err);
  });  
});

module.exports = router;
