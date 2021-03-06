var gsheets = require('../index'),
	async = require('async');

var theSheet = null, theWorksheet = null;

module.exports = {

	setUp: function(callback) {
		gsheets.auth({
			email: process.env.GSHEETS_USER,
			password: process.env.GSHEETS_PASS
		}, function(err) {
			if (err) {
				throw err;
			}
			gsheets.getSpreadsheet(process.env.GSHEETS_TEST_KEY, function(err, sheet) {
				if (err) {
					throw err;
				}
				theSheet = sheet;
				callback();
			});
		});
	},
	tearDown: function(callback) {
		theSheet = null;
		callback();
	},

	"get all rows": function(test) {
		test.expect(8);
		// get first worksheet and retrieve its rows
		theSheet.getWorksheet('First Sheet', function(err, worksheet) {
			test.ifError(err);
			test.ok(worksheet instanceof gsheets.Worksheet, 'Should return an instance of a worksheet');
			// get rows
			worksheet.getRows(function(err, rows) {
				test.ifError(err);
				test.ok(rows instanceof gsheets.Rows, 'Should return an instance of Rows');
				var rowData = rows.getRows();
				test.ok(rowData.length==5, 'Should return 5 rows, got ' + rowData.length);
				test.ok(rowData[0].data.columna == '1', 'First row Column A should equal 1 got ' + rowData[0].data.columna);
				test.ok(rowData[4].data.columna == '5', '5th row Column A should equal 5 got ' + rowData[4].data.columna);
				test.ok(rowData[2].data.moremore == '\'this\' should "work"', '3rd row More & More should equal \'this\' should "work" got ' + rowData[2].data.moremore);
				test.done();
			});
		});
	},
	"get rows reversed orderedby": function(test) {
		test.expect(8);
		// get first worksheet and retrieve its rows
		theSheet.getWorksheet('First Sheet', function(err, worksheet) {
			test.ifError(err);
			test.ok(worksheet instanceof gsheets.Worksheet, 'Should return an instance of a worksheet');
			// get rows
			worksheet.getRows({reverse: true, orderby: 'columna'}, function(err, rows) {
				test.ifError(err);
				test.ok(rows instanceof gsheets.Rows, 'Should return an instance of Rows');
				var rowData = rows.getRows();
				test.ok(rowData.length==5, 'Should return 5 rows, got ' + rowData.length);
				test.ok(rowData[4].data.columna == '1', 'First row Column A should equal 1 got ' + rowData[4].data.columna);
				test.ok(rowData[0].data.columna == '5', '5th row Column A should equal 5 got ' + rowData[0].data.columna);
				test.ok(rowData[2].data.moremore == '\'this\' should "work"', '3rd row More & More should equal \'this\' should "work" got ' + rowData[2].data.moremore);
				test.done();
			});
		});
	},
	"get rows simple query": function(test) {
		test.expect(6);
		// get first worksheet and retrieve its rows
		theSheet.getWorksheet('First Sheet', function(err, worksheet) {
			test.ifError(err);
			test.ok(worksheet instanceof gsheets.Worksheet, 'Should return an instance of a worksheet');
			// get rows
			worksheet.getRows({sq: 'columna > 4'}, function(err, rows) {
				test.ifError(err);
				test.ok(rows instanceof gsheets.Rows, 'Should return an instance of Rows');
				var rowData = rows.getRows();
				test.ok(rowData.length==1, 'Should return 1 row only, got ' + rowData.length);
				test.ok(rowData[0].data.columna == '5', 'First row Column A should equal 5 got ' + rowData[0].data.columna);
				test.done();
			});
		});
	},


	"add and delete row": function(test) {
		test.expect(8);
		// get first worksheet and retrieve its rows
		theSheet.getWorksheet('2nd Sheet', function(err, worksheet) {
			test.ifError(err);
			test.ok(worksheet instanceof gsheets.Worksheet, 'Should return an instance of a worksheet');
			worksheet.getRows(function(err, rows) {
				test.ifError(err);
				test.ok(rows instanceof gsheets.Rows, 'Should return an instance of Rows');
				var i = 0;
				rows.create({
					id: i,
					date: new Date().toUTCString(),
					value: 'A new value - ' + i
				}, function(err, row) {
					test.ifError(err);
					test.ok(row, 'Should return a row object');
					// now delete it again
					rows.remove(row, function(err) {
						test.ifError(err);
						// update sheet size back to 20 so we have space for deletion
						worksheet.set({
							rows: 20
						});
						worksheet.save(function(err, worksheet) {
							test.ifError(err);
							test.done();
						});
					});
				});
			});
		});
	},

	"add delete many rows": function(test) {
		test.expect(29);
		// get first worksheet and retrieve its rows
		theSheet.getWorksheet('2nd Sheet', function(err, worksheet) {
			test.ifError(err);
			test.ok(worksheet instanceof gsheets.Worksheet, 'Should return an instance of a worksheet');
			worksheet.getRows(function(err, rows) {
				test.ifError(err);
				test.ok(rows instanceof gsheets.Rows, 'Should return an instance of Rows');
				var i = 0;
				async.whilst(
					function() {
						return i < 10;
					},
					function(callback) {
						// create a row
						rows.create({
							id: i,
							date: new Date().toUTCString(),
							value: 'A new value - ' + i
						}, function(err, row) {
							i++;
							test.ifError(err);
							test.ok(row, 'Should return a row object');
							callback(err);
						});
					},
					function(err) {
						test.ifError(err);
						test.ok(i==10, 'Should have created 10 rows');
						worksheet.getRows(function(err, rows) {
							test.ifError(err);
							var rowData = rows.getRows();
							test.ok(rowData.length==10, 'Should return 10 rows');
							// resize worksheet to 0,0 to clear all data
							i = 0;
							async.each(rowData, function(item, callback) {
								rows.remove(item, callback);
							}, function(err) {
								// update sheet size back to 20 so we have space for deletion
								worksheet.set({
									rows: 20
								});
								worksheet.save(function(err, worksheet) {
									test.ifError(err);
									test.done();
								});
							});
						});
					}
				);
			});
		});
	}
};