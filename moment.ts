const moment = require('moment');


export function showWeeks(type) {

  let lastDayOfMonth = new Date();
  let date = new Date(), y = date.getFullYear(), m = date.getMonth();
  lastDayOfMonth.setHours(23, 59, 59, 999);
  let firstDayOfMonth;
  if (type == "one_month")
    firstDayOfMonth = new Date().setDate(lastDayOfMonth.getDate() - 30)
  else if (type == "three_month")
    firstDayOfMonth = new Date().setDate(lastDayOfMonth.getDate() - 90)
  return getWeeksFromDatesOfRange(new moment(firstDayOfMonth), new moment(lastDayOfMonth));

}

export function getWeeksFromDatesOfRange(startDate, stopDate) {

  var dateArray = new Array();
  var currentDate = new moment(startDate);
  while (currentDate <= stopDate) {
    let week = moment(new Date(currentDate)).isoWeek();
    dateArray.push(week);
    currentDate = currentDate.add(1, 'days');
  }
  var uniqueArray = [];
  for (let i = 0; i < dateArray.length; i++) {
    if (uniqueArray.indexOf(dateArray[i]) === -1) {
      uniqueArray.push(dateArray[i]);
    }
  }
  return uniqueArray;

}

export function getMonthsFromDates(startDate, stopDate) {

  let arrayMonths = []
  let firstDate = new moment(startDate);
  let lastdate = new moment(stopDate);

  let year_start = moment(new Date(firstDate)).year();
  let year_end = moment(new Date(lastdate)).year();

  if (year_end != year_start) {
    let month = moment(new Date(firstDate)).month();
    for (let i = month; i < 12; i++) {
      let data = {
        month: i,
        year: year_start

      }
      arrayMonths.push(data);
    }
    let end_month = moment(new Date(firstDate)).month();
    for (let i = 0; i <= end_month; i++) {
      let data = {
        month: i,
        year: year_end

      }
      arrayMonths.push(data);
    }

  } else {
    let month = moment(new Date(firstDate)).month();
    for (let i = month; i < 12; i++) {
      let data = {
        month: i,
        year: year_start

      }
      arrayMonths.push(data);
    }
  }
  return arrayMonths;
}



export function unique(arrArg) {
  return arrArg.filter(function (elem, pos, arr) {
    return arr.indexOf(elem) == pos;
  });
};

export function removeDuplicates(array, key) {
  let lookup = new Set();
  return array.filter(obj => !lookup.has(obj[key]) && lookup.add(obj[key]));
}


export function showWeeksInMonth(year, month) {
  let month_diff = 1;
  let lastDayOfMonth = new Date();
  lastDayOfMonth.setHours(23, 59, 59, 999);
  let firstDayOfMonth = new Date().setDate(lastDayOfMonth.getDate() - 30)
  var weeknumberlast = moment(lastDayOfMonth).isoWeek();
  var weeknumberfirst = moment(firstDayOfMonth).isoWeek();

  this.week_numbers[0] = weeknumberfirst;
  this.week_numbers[1] = weeknumberfirst + 1;
  this.week_numbers[2] = weeknumberfirst + 2;
  this.week_numbers[3] = weeknumberfirst + 3;

  if (weeknumberlast < weeknumberfirst) {
    this.week_numbers[4] = 1;
  }
  else
    this.week_numbers[4] = weeknumberfirst + 4;
  let firstWeek = moment(new Date(year, month, 1)).isoWeek();
  let lastWeek = moment(new Date(year, month + 1, 0)).isoWeek();
  let out = [firstWeek];
  if (firstWeek === 52 || firstWeek === 53) {
    firstWeek = 0;
  }

  for (let i = firstWeek + 1; i <= lastWeek; i++) {
    out.push(i);
  }

  return out;
}


export function showWeekDays() {

  let date = new Date(), y = date.getFullYear(), m = date.getMonth();
  date.setHours(0, 0, 0, 0);
  let lastday = moment(new Date());
  let day_item = ['Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat', 'Sun'];
  let days = [];
  let firstdate = moment(date.setDate(date.getDate() - 6));
  let firstday = firstdate.day();
  let day_numbers = [0, 0, 0, 0, 0, 0, 0];
  day_numbers[0] = firstday;
  let item = 0;
  if (firstday != 0)
    item = (firstday - 1);
  else
    item = (firstday);
  days.push(day_item[item]);
  day_numbers[day_numbers.length - 1] = lastday.day();

  for (let i = 1; i <= 5; i++) {
    let findday = firstday + i;

    let day = findday % 7;
    let index = day;

    if (day != 0)
      index = (day - 1);
    else
      index = (findday - 1);
    days.push(day_item[index]);
    day_numbers[i] = day == 0 ? 7 : day;
  }

  if (lastday.day() != 0)
    item = (lastday.day() - 1);
  else
    item = (lastday.day())
  days.push(day_item[item]);
  return { lineChartLabels: days, day_numbers: day_numbers };
}


export function getDayIndexFromDay(day_name) {
  let week_day_obj = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 7
  }
  return week_day_obj[day_name];
}
export function getDayIndexFromDate(dateParam) {
  var dt = moment(dateParam);
  return dt.day();
}

export function addDdaysToDate(addingWith, day_no) {
  return moment(addingWith).add(day_no, 'days');
}

export function getNextMonth() {
  return moment().add(1, 'months');
}

export function isAfter(base, comp) {
  return moment(base).isAfter(comp, 'day');
}

export function getDateBeforeMinutes(mnt) {
  let mntBefore = moment().subtract(mnt, 'minutes');
  return new Date(mntBefore);
}

export function getDateOfSpecificDayAgo(date_of, day) {
  return moment(date_of).subtract(day, 'days').format();
}

export function convertTimeto24Format(time) {
  return moment(time, 'hh:mm A').format('HH:mm');
}

export function getLastSevenDaysNameWithIndex() {
  return [6, 5, 4, 3, 2, 1, 0].map((n, i) => {
    let dt = moment().subtract(n, "days")
    let obj: any = {};
    obj.indx = dt.isoWeekday();
    obj.nam = dt.format("ddd");
    return obj;
  })
}

export function getAllWeeksDayBeforeOf(days) {
  let weeks = Array(days).fill("#").map((n, i) => {
    let dt = moment().subtract(i, "days")
    return dt.isoWeek();
  })
  return unique(weeks).reverse().map(n => {
    return { indx: n, nam: ('W' + n.toString()) }
  })
}

export function getAllMonthsDayBeforeOf(days) {
  let months = Array(days).fill("#").map((n, i) => {
    let dt = moment().subtract(i, "days")
    return (dt.month() + 1) + ',' + dt.format("YY");
  })
  return unique(months).reverse().map(n => {
    return { indx: parseInt(n.split(',')[0]), nam: MONTHS_NAME[parseInt(n.split(',')[0]) - 1] + '-' + n.split(',')[1] }
  })
}

export function getformatDate(date, formattext) {

  return moment(date).format(formattext);
}

export function addTimeToDate(date, time) {
  let timeArr = time.split(' ');
  let dt = new Date(date);
  let tm = timeArr[0].split(':');
  //  console.log("time and date", dt + " " + tm);
  dt.setHours(parseInt(tm[0]), parseInt(tm[1]));
  return dt;
}

const MONTHS_NAME = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

