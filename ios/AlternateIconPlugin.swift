@objc(AlternateIconPlugin) class AlternateIconPlugin : CDVPlugin {

    @objc(change:)
    func change(command: CDVInvokedUrlCommand) {
        let options = command.arguments[0] as! NSMutableDictionary
        let selectedOption = options.value(forKey: "selected") as? String ?? nil
        UIApplication.shared.setAlternateIconName(selectedOption)
        
        /* let vc = UIViewController()
        self.viewController.present(vc, animated: false, completion: {
            vc.dismiss(animated: false, completion: nil)
        }) */

        let pluginResult = CDVPluginResult(status: CDVCommandStatus_OK, messageAs: selectedOption);
        commandDelegate.send(pluginResult, callbackId:command.callbackId);
    }

}
