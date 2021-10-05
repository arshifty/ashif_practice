import * as moment from 'moment';

export function monthDifTwoDates(from_date, to_date) {
  return moment(to_date).diff(moment(from_date), 'month');
} 

export function getformatDate(date, formattext) {

  return moment(date).format(formattext);
}