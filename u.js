/*
 Code needs some cleanup, especialy the value setting and an additional option to
 set format would be nice. I didn't want to use any specific library and bloat the code for that.
 
    -> On mobile and tablet devices it defaults to the input[type="date"] so that the date keyboard shows up.
    -> Navigating through the options is also available with tab and enter key
    
    @TODO 
      -> implement navigating up and down with arrow keys ( I'll probably do that tomorrow :D)
      -> implement navigating between months when on day view (next month and previous month)
    
    Designed and concept by Jan Markeljc -> http://markeljc.com/
    Coded by Jonas Badalic -> http://badalic.com/
   
 If you like it heart it || use it || break it || make it better :)! 
*/
console.clear();

class datepicker {
  constructor(picker, options) {
    this._PICKER = picker;
    this._INPUT = picker.getElementsByTagName('input')[0];
    this._YEARLIST = picker.getElementsByClassName('list__years')[0];
    this._MONTHLIST = picker.getElementsByClassName('list__months')[0];
    this._DAYLIST = picker.getElementsByClassName('list__days')[0];
    this._MONTHLABEL = picker.getElementsByClassName('datepicker__month')[0];

    this._CONTAINER = picker.getElementsByClassName('datepicker__lists')[0];
    this.closeDatePicker = this.closeDatePicker.bind(this);

    var dmax = new Date(Date.parse(options.max));
    var dmin = new Date(Date.parse(options.min || '1900-01-01'));

    this._CONFIG = {
      MAX_YEAR: dmax.getFullYear(),
      MAX_MONTH: dmax.getMonth() + 1,
      MAX_DAY: dmax.getDate(),
      MAX_DATE: `${dmax.getFullYear()}-${dmax.getMonth() + 1}-${dmax.getDate()}`,

      MIN_YEAR: dmin.getFullYear(),
      MIN_MONTH: dmin.getMonth(),
      MIN_DAY: dmin.getDate(),
      MIN_DATE: `${dmin.getFullYear()}-${dmin.getMonth()}-${dmin.getDate()}`,
      VALIDATOR: options.validator ? options.validator : /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}/g };


    // Event handlers
    this.onInputFocus = this.onInputFocus.bind(this);

    this._VALUES = {
      year: undefined,
      month: undefined,
      day: undefined };

    this._MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'];


    // 0 === years,
    // 1 === months
    // 2 === days
    this._CURRENT_STEP = 0;

    this.setYear = this.setYear.bind(this);
    this.setMonth = this.setMonth.bind(this);
    this.setDay = this.setDay.bind(this);

    this.init = this.init.bind(this);

    this.handleArrowKeys = this.handleArrowKeys.bind(this);
    this.removeKeyInputs = this.removeKeyInputs.bind(this);
    this.detectKeyInputs = this.detectKeyInputs.bind(this);

    this.validate = this.validate.bind(this);

    this.init(this._CONFIG.MIN_DATE, this._CONFIG.MAX_DATE);
  }

  /** 
    Calculate years between the min and max date
  **/
  betweenYears(minDate, maxDate) {
    var list = [];
    var minA = minDate.split('-');
    var maxA = maxDate.split('-');
    var mindate = new Date(minA[0], minA[1], minA[2]);
    var maxdate = new Date(maxA[0], maxA[1], maxA[2]);

    for (var i = mindate.getFullYear(); i < maxdate.getFullYear() + 1; i++) {
      list.unshift(i);
    }
    return list;
  }

  /**
    Prepare months - check selected year, if it is max or min 
    year and remove months below min or above max
    @TODO ->
      tidy + map with function that returns html string
  **/
  prepareMonths(year) {
    var months;
    var monthList;
    var monthCopy = this._MONTHS.slice();

    if (this._CONFIG.MAX_YEAR === year) {
      months = monthCopy.splice(0, this._CONFIG.MAX_MONTH);
      monthList = months.map(i => `<li label="month ${i}" tabindex="0">${i}</li>`);
    } else if (this._CONFIG.MIN_YEAR === year) {
      months = monthCopy.slice(this._CONFIG.MIN_MONTH, 12);
      monthList = months.map(i => `<li label="month ${i}" tabindex="0">${i}</li>`);
    } else {
      months = monthCopy;
      monthList = monthCopy.map(i => `<li label="month ${i}" tabindex="0">${i}</li>`);
    }
    this._MONTHLIST.innerHTML = monthList.join('');
    var monthsSelection = this._MONTHLIST.getElementsByTagName('li');

    for (let i = 0; i < months.length; i++) {
      monthsSelection[i].addEventListener('click', event => {
        event.stopPropagation();
        this.setMonth(this._MONTHS.indexOf(months[i]) + 1);
      });
    }
  }
  /**
    Prepare days - check selected month and year, if they are max or min
    remove all below min and all above max day
    @TODO ->
      tidy + map with fn that returns html string
  **/
  prepareDays(month) {
    var monthIndex = this._MONTHS.indexOf(month) + 1;
    var days = [];
    var daysList;

    var n = new Date(this._VALUES.year, monthIndex, 0).getDate() + 1;
    for (let i = 1; i < n; i++) {
      days.push(i);
    }

    if (this._CONFIG.MAX_YEAR === this._VALUES.year &&
    this._CONFIG.MAX_MONTH === this._VALUES.month) {
      days = days.splice(0, this._CONFIG.MAX_DAY);
      daysList = days.map(i => `<li label="${i}th of ${this._MONTHS[this._VALUES.month - 1]}" tabindex="0">${i}</li>`);
    } else if (this._CONFIG.MIN_YEAR === this._VALUES.year &&
    this._CONFIG.MIN_MONTH + 1 === this._VALUES.month) {
      days = days.slice(this._CONFIG.MIN_DAY, 31);
      daysList = days.map(i => `<li label="${i}th of ${this._MONTHS[this._VALUES.month - 1]}" tabindex="0">${i}</li>`);
    } else {
      daysList = days.map(i => `<li label="${i}th of ${this._MONTHS[this._VALUES.month - 1]}" tabindex="0">${i}</li>`);
    }

    this._DAYLIST.innerHTML = daysList.join('');
    var daysSelection = this._DAYLIST.getElementsByTagName('li');

    var dayLength = daysSelection.length;
    for (let i = 0; i < dayLength; i++) {
      daysSelection[i].addEventListener('click', event => {
        event.stopPropagation();
        this.setDay(days[i]);
      });
    }
  }

  // On year select
  setYear(year) {
    this._VALUES.year = year;
    this.prepareMonths(this._VALUES.year);
    this._CONTAINER.classList.add('view--month');
    this._CURRENT_STEP = 1;
    this._PICKER.getElementsByClassName('list__months')[0].getElementsByTagName('li')[0].focus();
  }
  // On month select
  setMonth(month) {
    this._MONTHLABEL.innerHTML = this._MONTHS[month - 1];
    this._VALUES.month = month;
    this.prepareDays(month);
    this._CONTAINER.classList.add('view--day');
    this._CURRENT_STEP = 2;
    setTimeout(() => {
      this._PICKER.getElementsByClassName('list__days')[0].getElementsByTagName('li')[0].focus();
    }, 300);
  }
  // On day select
  setDay(day) {
    this._VALUES.day = day;
    this.closeDatePicker(true);
    this._CURRENT_STEP = 0;
    this.detectKeyInputs();
  }

  closeDatePicker(update) {
    this._CONTAINER.className = 'datepicker__lists';
    this._PICKER.classList.remove('datepicker--visible');
    if (update) {
      this._INPUT.value = `${this.formatNumber(this._VALUES.day)}/${this.formatNumber(this._VALUES.month)}/${this.formatNumber(this._VALUES.year)}`;
    }
  }
  formatNumber(num) {
    if (num < 10) {
      return "0" + num;
    } else {
      return num;
    }
  }
  onInputFocus() {
    this._PICKER.classList.add('datepicker--visible');
    this._PICKER.getElementsByClassName('list__years')[0].getElementsByTagName('li')[0].focus();
    this._CURRENT_STEP = 0;
    this.detectKeyInputs();
  }
  isMobile() {
    if (navigator.userAgent.match(/Android/i) ||
    navigator.userAgent.match(/webOS/i) ||
    navigator.userAgent.match(/iPhone/i) ||
    navigator.userAgent.match(/iPad/i) ||
    navigator.userAgent.match(/iPod/i) ||
    navigator.userAgent.match(/BlackBerry/i) ||
    navigator.userAgent.match(/Windows Phone/i))
    {
      return false;
    } else {
      return false;
    }
  }
  init(min, max) {
    if (this.isMobile()) {
      this._INPUT.type = 'date';
    } else {
      this._INPUT.addEventListener('focus', this.onInputFocus);
      this._INPUT.addEventListener('input', this.validate);

      window.addEventListener('click', event => {
        this.closeDatePicker();
        this.removeKeyInputs();
      });
      this._PICKER.addEventListener('click', event => {
        event.stopPropagation();
      });

      var yearlist = this.betweenYears(min, max);
      this._YEARLIST.innerHTML = yearlist.map((i, c) => `<li label="year ${i}" tabindex="${0}">${i}</li>`).join('');

      var yearSelections = this._YEARLIST.getElementsByTagName('li');
      var yearLength = yearSelections.length;
      for (let i = 0; i < yearLength; i++) {
        yearSelections[i].addEventListener('click', event => {
          event.stopPropagation();
          this.setYear(yearlist[i]);
        });
      }
    }
  }
  detectKeyInputs() {
    document.addEventListener('keydown', this.handleArrowKeys);
  }
  removeKeyInputs() {
    document.removeEventListener('keydown', this.handleArrowKeys);
  }
  handleArrowKeys(event) {
    const isArrow = event.keyCode === 37 || event.keyCode === 39 || event.keyCode === 13;
    if (isArrow) {
      if (event.keyCode === 37) {
        // left
        var focusEl = document.activeElement;
      } else {
        // right
        var focusEl = document.activeElement;
        focusEl.click();
      }
    }
  }
  validate(event) {
    var val = event.target.value;
    var isValid = this._CONFIG.VALIDATOR.test(val);
    /**
      @TODO -> display error message
    **/
  }}


var init = new datepicker(document.querySelectorAll('.datepicker__container')[0], {
  max: '2020-12-31',
  min: '1920-1-1' });
