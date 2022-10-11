function AlternateIcon() {
    this.availableOptions = ["AVAILABLE_OPTIONS"];
};

AlternateIcon.prototype.change = function(selectedOption, success, error) {
    if (this.availableOptions.includes(selectedOption) || selectedOption === null) {
        var options = [{ selected: selectedOption, available: this.availableOptions }]
        cordova.exec(success, error, 'AlternateIcon', 'change',  options);
    } else {
        throw new Error(selectedOption + "is not a valid icon");
    }
};

module.exports = new AlternateIcon();
