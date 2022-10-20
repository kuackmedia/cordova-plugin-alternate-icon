@objc(AlternateIconPlugin) class AlternateIconPlugin : CDVPlugin {

    @objc(getCurrentName:)
    func getCurrentName(command: CDVInvokedUrlCommand) {
        let name = UIApplication.shared.alternateIconName
        let result: String? = {
            switch name {
                case nil:
                    return "default"
                default:
                    return name;
            }
        }()
        
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: result);
        commandDelegate.send(pluginResult, callbackId:command.callbackId);
    }

    @objc(change:)
    func change(command: CDVInvokedUrlCommand) {
        let options = command.arguments[0] as! NSMutableDictionary
        let selectedOption = options.value(forKey: "selected") as? String ?? nil
        UIApplication.shared.setAlternateIconName(selectedOption)

        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: selectedOption);
        commandDelegate.send(pluginResult, callbackId:command.callbackId);
    }

    @objc(changeAndRestart:)
    func changeAndRestart(command: CDVInvokedUrlCommand) {
        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: "changeAndRestart not available on iOS");
        commandDelegate.send(pluginResult, callbackId:command.callbackId);
    }

}
