// In case the data is hosted elsewhere.
window.BASE_URL = "/";

// For csv chunks, extract the chunk with the given header.
// Return array of lines or null.
function extractChunk(data, header) {
  var lines = data.split("\n");
  var result = [];
  var got = false;
  for (var i = 0; i < lines.length; i++) {
    // Look for the right header.
    if (lines[i] == header) {
      got = true;
    // Then collect.
    } else if (got) {
      // If we reach the end of the chunk, a blank line, stop.
      if (lines[i].length == 0) {
        break;
        // Otherwise, collect.
      } else {
        result.push(lines[i]);
      }
    }  
  }

  // If it wasn't found, report that.
  if (result.length == 0) {
    result = null;
  }

  return result;
}

// Fetch named chunk from remote server.
// Return array of lines or null for not found.
// Different types have different has prefix lengths.
function fetchChunk(key, prefixLength, base, callback) {
  var hash = CryptoJS.MD5(key);
  var filename = base + hash.toString(CryptoJS.enc.Hex).substring(0, prefixLength).toUpperCase();
  $.get(filename, function(responseText) {
    var chunk = extractChunk(responseText, key);
    callback(chunk);
  }).fail(function() {
    callback(null);
  });
}

// Convert a chunk of CSV as an array of lines, e.g. ["2010-01-01,100"] to Rickshaw format.
// No headers.
function csvChunkToDateChartData(lines) {
  var data = [];
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i].split(",");
    data.push({x: new Date(line[0]).getTime() / 1000, y: parseInt(line[1])});
  }

  return data;
}

// Convert a full CSV file as an array of lines to Rickshaw 2d series format.
function csvToDateChartData(lines) {
  var headerNames = lines[0].split(",").slice(1);
    
  // Series number -> entry
  var seriesData = [];
  for (var i = 0; i < headerNames.length; i++) {
    seriesData.push([]);
  }

  for (var i = 1; i < lines.length; i++) {
    var line = lines[i].split(",");
    for (var j = 1; j < line.length; j++) {
      seriesData[j-1].push({x: new Date(line[0]).getTime() / 1000, y: parseInt(line[j])});
    }
  }

  var palette = new Rickshaw.Color.Palette( { scheme: 'cool' } );
  var series = [];
  for (var i = 0; i < seriesData.length; i++) {
    series.push({
      color: palette.color(),
      data: seriesData[i],
      name: headerNames[i]
    });
  }

  return series;
}

// Fetch a CSV file from remote server.
// Return array of lines or null for not found.
function fetchCSV(name, base, callback) {
  var filename = base + name;
  $.get(filename, function(data) {
    var csv = data.split("\n");
    
    // Remove trailing line.
    if (csv[csv.length-1].length == 0) {
      csv = csv.slice(0, csv.length-1);
    }

    if (csv.length == 0) {
      return null;
    } else {
      callback(csv);
    }
  }).fail(function() {
    callback(null);
  });
}

// For a set of Rickshaw-ready series data, project the names by mappings, and only those contained.
function pickSeries(chartData, mapping) {
  return chartData.map(function(serie) {
    if (mapping[serie.name]) {
      return {name: mapping[serie.name], data: serie.data, color: serie.color};
    }
  }).filter(function(n){ return n != undefined });
}
