var ccp = {};

ccp.songs = [];

/**
 * Takes a song and parses it into a usable object.
 *
 * @param {object} song
 *
 * @return {object} [description]
 */
ccp.parse = function(song) {
  let parsed = {};
  let chart = [];
  let section = [];
  const lines = song.chart.split(/\r?\n/);
  lines.forEach(function(line) {
    if(line.replace(/[ABCDEFG](#|b)?(m(aj)?)?(add|sus)?(\d)?(\/)?([ABCDEFG])?(#|b)?/g, '').trim() === '' && line.trim() !== '') {
      section.push({
        'text': line,
        'type': 'chord'
      });
    } else if(line.trim().match(/^\[.*?\]$/) !== null) {
      if(section.length > 0) {
        chart.push(section);
        section = [];
      }
      section.push({
        'text': line.replace(/[\[\]]/g, ''),
        'type': 'title'
      });
    } else if(line.trim().match(/^\/\//) !== null) {
      section.push({
        'text': line.replace(/\/\//, '').trim(),
        'type': 'note'
      });
    } else {
      section.push({
        'text': line,
        'type': 'lyric'
      });
    }
  });
  chart.push(section);

  // Transpose from the written key to the selected key.
  const lookup = {
    'A': 0,
    'A#': 1,
    'Bb': 1,
    'B': 2,
    'C': 3,
    'C#': 4,
    'Db': 4,
    'D': 5,
    'D#': 6,
    'E': 7,
    'F': 8,
    'F#': 9,
    'Gb': 9,
    'G': 10,
    'G#': 11,
    'Ab': 12
  };
  const key = window.localStorage.getItem(ccp.get_local_storage_key(song) + '.key') || song.key;
  ccp.transpose(chart, lookup[key] - lookup[song.key]);

  // Transpose the song according to the selected transpose.
  const transpose = +window.localStorage.getItem(ccp.get_local_storage_key(song) + '.transpose') || 0;
  ccp.transpose(chart, transpose);

  return {
    'chart': chart,
    'line_count': lines.length,
    'title': song.title,
    'author': song.author,
    'key': key,
    'capo': transpose * -1,
    'tempo': song.tempo,
    'timing': song.timing,
    'tuning': song.tuning,
    'example': song.example
  };
}

/**
 * Transposes all of the chords in a parsed song a certain number of
 * semitones. Mutates the original object.
 *
 * @param {object} chart
 * @param {number} semitones The number of semitones to move. Can be negative.
 */
ccp.transpose = function(chart, semitones) {
  const lookup = {
    'A': 0,
    'A#': 1,
    'Bb': 1,
    'B': 2,
    'C': 3,
    'C#': 4,
    'Db': 4,
    'D': 5,
    'D#': 6,
    'E': 7,
    'F': 8,
    'F#': 9,
    'Gb': 9,
    'G': 10,
    'G#': 11,
    'Ab': 12
  }

  const notes_sharp = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
  const notes_flat = ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab'];

  chart.forEach(function(section) {
    section.forEach(function(line) {
      if(line.type === 'chord') {
        let matches = line.text.match(/([a-z0-9\s\/])|([ABCDEFG](#|b)?)/g);
        let new_line_text = '';
        matches.forEach(function(match, i) {
          if(lookup[match] !== undefined) {
            let index = lookup[match];
            let new_index = (index + semitones + 12) % 12;

            // if(match.includes('#') === true) {
              new_line_text += notes_sharp[new_index];
            // } else {
            //   new_line_text += notes_flat[new_index];
            // }
          } else {
            new_line_text += match;
          }
        });
        line.text = new_line_text;
      }
    });
  });
}

/*ccp.change_key = function(key, semitones) {
  const lookup = {
    'A': 0,
    'A#': 1,
    'Bb': 1,
    'B': 2,
    'C': 3,
    'C#': 4,
    'Db': 4,
    'D': 5,
    'D#': 6,
    'E': 7,
    'F': 8,
    'F#': 9,
    'Gb': 9,
    'G': 10,
    'G#': 11,
    'Ab': 12
  }

  const notes_sharp = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
  const notes_flat = ['A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab'];

  const index = lookup[key];
  const new_index = (index + semitones + 12) % 12;

  // if(key.includes('#') === true) {
    return notes_sharp[new_index];
  // } else {
    // return notes_flat[new_index];
  // }
}*/

ccp.get_local_storage_key = function(i) {
  if(Number.isInteger(i) === true) {
    song = ccp.songs[i];
  } else {
    song = i;
  }
  return (song.title + song.author).replace(/[^A-z]/g, '').toLowerCase();
}

/**
 * Set the key of the song.
 */
ccp.set_key = function(i, key) {
  window.localStorage.setItem(ccp.get_local_storage_key(i) + '.key', key);
  ccp.render_song(i);
}

/**
 * Update the key of a song.
 */
ccp.set_transpose = function(i, transpose) {
  window.localStorage.setItem(ccp.get_local_storage_key(i) + '.transpose', transpose);
  // ccp.songs[i].my_transpose = my_transpose;
  // ccp.songs[i].capo = my_transpose * -1;
  ccp.render_song(i);
}

/**
 * Render a list of songs out to the window.
 */
ccp.render_song_list = function() {
  ccp.songs.sort(function(a, b) {
    return a.title.localeCompare(b.title);
  });

  let html = '';
  ccp.songs.forEach(function(song, i) {
    html += '<div class="song" onclick="ccp.render_song(' + i + ')">';
    html += '<div class="song_title">' + song.title + '</div>';
    html += '<div class="song_author">' + song.author + '</div>';
    html += '</div>';
  });

  document.body.innerHTML = html
}

ccp.render_song = function(i, download) {
  const song = ccp.songs[i];
  const parsed = ccp.parse(song);

  const line_limit = 90;
  const show_chords = true;

  /**
   * Try to make the columns relatively even in height instead of filling
   * the left column first.
   */
  const balance_columns = true;

  const pdf = new jspdf.jsPDF({
    'format': 'letter',
    'putOnlyUsedFonts': true
  });
  let html = '<div class="chord_sheet">';

  const page_width = pdf.internal.pageSize.getWidth();
  const page_height = pdf.internal.pageSize.getHeight();

  const margin = 10;
  const column_spacing = 5;

  const column_x = [
    margin,
    (page_width / 2) + (column_spacing / 2)
  ];
  const column_width = (page_width - (margin * 2) - column_spacing) / 2;

  let x = column_x[0];
  let y = margin;

  pdf.setFont('courier', 'bold');
  pdf.setFontSize(16);
  pdf.setTextColor(0, 0, 0);

  const title = parsed.title + ' [' + (parsed.my_key || parsed.key) + ']';
  const title_width = pdf.getTextWidth(title);
  pdf.text(title, x, y);
  html += '<div class="header"><div class="title">' + title + '</div><div class="author">' + parsed.author + '</div></div>';

  let extra_info = [];
  if(parsed.capo !== 0) {
    extra_info.push('Capo: ' + parsed.capo);
  }
  if(parsed.timing !== undefined) {
    extra_info.push('Timing: ' + parsed.timing);
  }
  if(parsed.tempo !== undefined) {
    extra_info.push('Tempo: ' + parsed.tempo + 'bpm');
  }
  if(parsed.tuning !== undefined) {
    extra_info.push('Tuning: ' + parsed.tuning);
  }


  if(extra_info.length > 0) {
    pdf.setFont('courier', 'italic');
    pdf.setFontSize(10);
    pdf.setTextColor(150, 150, 150);
    pdf.text(extra_info.join(', '), (x + title_width + 2), y);
    html += '<div class="extra_info">' + extra_info.join(' • ');
    html += '<span style="cursor: pointer" onclick="ccp.render_song(' + i + ', true);"> ▼ Rehearsal</span>';
    html += '<span style="cursor: pointer" onclick="ccp.download_live(' + i + ');"> ▼ Live</span>';
    html += '</div>';
  }

  y += 4;

  pdf.setFont('courier', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text(parsed.author, x, y);
  y += 8;

  // HTML Transposer Controls
  html += '<table cellpadding="0" cellspacing="0" width="100%">';
  html += '<tr>';

  html += '<td width="4%"><div class="transpose_down" onclick="ccp.set_transpose(' + i + ',' + (+window.localStorage.getItem(ccp.get_local_storage_key(song) + '.transpose') - 1) + ');">-</div></td>';
  html += '<td class="transpose_value">' + (+window.localStorage.getItem(ccp.get_local_storage_key(song) + '.transpose')) + '</td>';
  html += '<td width="4%"><div class="transpose_up" onclick="ccp.set_transpose(' + i + ',' + (+window.localStorage.getItem(ccp.get_local_storage_key(song) + '.transpose') + 1) + ');">+</div></td>';

  ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].forEach(function(key) {
    var td_class;
    if(key === parsed.key) {
      td_class = "key_selector_active";
    } else {
      td_class = "key_selector_inactive";
    }
    html += '<td width="7.2%" class="' + td_class + '" onclick="ccp.set_key(' + i + ', \'' + key + '\');">' + key + '</td>';
  });
  html += '</tr>';
  html += '</table>';

  // html += '<div class="actions">';
  // html += '<table cellpadding="0" cellspacing="0">';
  // html += '<tr>';
  // html += '<td>Transpose: </td>';
  // html += '<td><div class="transpose_down" onclick="ccp.set_transpose(' + i + ',' + (+window.localStorage.getItem(ccp.get_local_storage_key(song) + '.transpose') - 1) + ');">-</div></td>';
  // html += '<td>' + (+window.localStorage.getItem(ccp.get_local_storage_key(song) + '.transpose')) + '</td>';
  // html += '<td><div class="transpose_up" onclick="ccp.set_transpose(' + i + ',' + (+window.localStorage.getItem(ccp.get_local_storage_key(song) + '.transpose') + 1) + ');">+</div></td>';
  // html += '<td><div onclick="ccp.render_song(' + i + ', true);">Download</div></td>';
  // html += '</tr>';
  // html += '</table>';
  // html += '</div>';

  const column_y = y;

  pdf.setFontSize(10);
  pdf.setFont('courier', 'normal');

  let current_line = 0;
  html += '<div class="sections">';
  parsed.chart.forEach(function(section) {
    // Check to see if we need to switch to a new column.
    if(balance_columns === true) {
      if(current_line + section.length  >= parsed.line_count / 2) {
        x = column_x[1];
        y = column_y;
        current_line = 0;
      }
    } else {
      if(current_line + section.length > line_limit) {
        x = column_x[1];
        y = column_y;
        current_line = 0;
      }
    }

    section.forEach(function(line) {
      switch(line.type) {
        case 'chord':
          if(show_chords === true) {
            pdf.setFont('courier', 'bold');
            pdf.setTextColor(255, 0, 0);
            pdf.text(line.text, x, y);
            html += '<div class="' + line.type + '">' + line.text + '</div>';
            y += 2.8;
          }
        break;
        case 'title':
          pdf.setFillColor(220, 220, 220);
          pdf.rect(x, (y - 3), column_width, 4, 'F');
          pdf.setFont('courier', 'bold');
          pdf.setTextColor(0, 0, 0);
          pdf.text(line.text.trim(), (x + 0.5), y);
          html += '<div class="' + line.type + '">' + line.text.trim() + '</div>';
          y += 4.2;
        break;
        case 'lyric':
          pdf.setFont('courier', 'normal');
          pdf.setTextColor(0, 0, 0);
          pdf.text(line.text, x, y);
          html += '<div class="' + line.type + '">' + line.text + '&nbsp;</div>';
          y += 3.5;
        break;
        case 'note':
          pdf.setFont('courier', 'italic');
          pdf.setTextColor(150, 150, 150);
          pdf.text(line.text, x, y);
          html += '<div class="' + line.type + '">' + line.text + '</div>';
          y += 3;
        break;
      }
      current_line++;

    })

  });
  html += '</div>'; // End sections
  html += '</div>'; // End chord_sheet

  if(download === true) {
    pdf.save(parsed.title + ' - ' + parsed.author + ' [' + parsed.key + '].pdf');
  }

  document.body.innerHTML = html;
}

/**
 * Download a PDF for use when playing live.
 */
ccp.download_live = function(i) {
  const song = ccp.songs[i];
  const parsed = ccp.parse(song);

  const line_limit = 35;

  const pdf = new jspdf.jsPDF({
    'format': 'letter',
    'putOnlyUsedFonts': true
  });

  const page_width = pdf.internal.pageSize.getWidth();
  const page_height = pdf.internal.pageSize.getHeight();

  const margin = 5;

  let x, y, current_line;

  const draw_page_header = function() {
    // PDF background
    pdf.setFillColor('#2e2e2e');
    pdf.rect(0, 0, page_width, page_height, 'F');

    x = margin;
    y = margin + 4; // Add extra due to text placing from the bottom left corner.
    current_line = 0;

    pdf.setFont('courier', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor('#d6d6d6');

    const title = parsed.title + ' [' + (parsed.my_key || parsed.key) + ']';
    pdf.text(title, x, y);

    y += 6;

    let extra_info = [];
    if(parsed.capo !== 0) {
      extra_info.push('Capo: ' + parsed.capo);
    }
    if(parsed.timing !== undefined) {
      extra_info.push('Timing: ' + parsed.timing);
    }
    if(parsed.tempo !== undefined) {
      extra_info.push('Tempo: ' + parsed.tempo + 'bpm');
    }
    if(parsed.tuning !== undefined) {
      extra_info.push('Tuning: ' + parsed.tuning);
    }

    pdf.setFont('courier', 'normal');
    pdf.setFontSize(14);
    pdf.setTextColor('#d6d6d6');
    pdf.text(parsed.author, x, y);
    y += 5;

    pdf.text(extra_info.join(' • '), x, y);
    y += 10;
  };

  draw_page_header();



  parsed.chart.forEach(function(section) {
    if(current_line + section.length > line_limit) {
      pdf.addPage();
      draw_page_header();
    }

    section.forEach(function(line) {
      switch(line.type) {
        case 'chord':
          pdf.setFont('courier', 'bold');
          pdf.setFontSize(20);
          pdf.setTextColor('#e5b567');
          pdf.text(line.text, x, y);
          y += 6;
        break;
        case 'title':
          pdf.setFillColor('#333435');
          pdf.rect(x, (y - 6), page_width - (margin * 2), 8, 'F');
          pdf.setFont('courier', 'bold');
          pdf.setFontSize(20);
          pdf.setTextColor('#d6d6d6');
          pdf.text(line.text.trim(), (x + 2), y);
          y += 8;
        break;
        case 'lyric':
          pdf.setFont('courier', 'normal');
          pdf.setFontSize(20);
          pdf.setTextColor('#d6d6d6');
          pdf.text(line.text, x, y);
          y += 7;
        break;
        case 'note':
          pdf.setFont('courier', 'italic');
          pdf.setFontSize(20);
          pdf.setTextColor('#797979');
          pdf.text(line.text, x, y);
          y += 6;
        break;
      }
      current_line++;

    })

  });

  pdf.save(parsed.title + ' - ' + parsed.author + ' [' + parsed.key + '].pdf');
}

ccp.download_rehearsal = function(i) {

}
