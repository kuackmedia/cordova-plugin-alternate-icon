function AlternateIcon() {
    this.availableOptions = ["AVAILABLE_OPTIONS"];
};

AlternateIcon.prototype.getCurrentName = function(success, error) {
    var options = [{ available: this.availableOptions }];
    cordova.exec(success, error, 'AlternateIcon', 'getCurrentName', options);
};

AlternateIcon.prototype.change = function(selectedOption, success, error) {
    if (this.canChangeTo(selectedOption)) {
        var options = [{ selected: selectedOption, available: this.availableOptions }];
        cordova.exec(success, error, 'AlternateIcon', 'change',  options);
    } else {
        throw new Error(selectedOption + " is not a valid icon");
    }
};

AlternateIcon.prototype.changeAndRestart = function(selectedOption, success, error) {
    if (this.canChangeTo(selectedOption)) {
        var options = [{ selected: selectedOption, available: this.availableOptions }];
        cordova.exec(success, error, 'AlternateIcon', 'changeAndRestart',  options);
    } else {
        throw new Error(selectedOption + " is not a valid icon");
    }
};

AlternateIcon.prototype.canChangeTo = function(selectedOption) {
    return this.availableOptions.includes(selectedOption) || selectedOption === null;
};

module.exports = new AlternateIcon();
