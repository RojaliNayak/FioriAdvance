sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("YRTV_ONE_TILE.YRTV_ONE_TILE.controller.Worklist.BaseController", {
		/**
		 * Convenience method for accessing the router.
		 * @public
		 * @returns {sap.ui.core.routing.Router} the router for this component
		 */
		getRouter: function () {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},

		/**
		 * Convenience method for getting the view model by name.
		 * @public
		 * @param {string} [sName] the model name
		 * @returns {sap.ui.model.Model} the model instance
		 */
		getModel: function (sName) {
			return this.getView().getModel(sName);
		},

		/**
		 * Convenience method for setting the view model.
		 * @public
		 * @param {sap.ui.model.Model} oModel the model instance
		 * @param {string} sName the model name
		 * @returns {sap.ui.mvc.View} the view instance
		 */
		setModel: function (oModel, sName) {
			return this.getView().setModel(oModel, sName);
		},
		setScanId: function (sId) {
			return this.getOwnerComponent().setScanId(sId);
		},

		onScanField: function (sID) {
			var oComp = this.getOwnerComponent();
			var fnHandleScan = function (sValue) {
				if (sValue) {
					// console.log("Handle Scan Started");
					// Check if the input field is disabled(for Scanning fields) , then only process the scan
					var oControl = sap.ui.getCore().byId(sID);
					if (oControl) {
						// console.log("Control Read Started");
					
						oControl.setValue(sValue);
						// oControl.fireSearch();
						// oControl.fireChange();
						oControl.fireLiveChange();
					
					} else {
						console.log("Scanned did not work");
						// do nothing
					}
				}
			};

			oComp.setScanId(sID);
			oComp.setScanInput({
				id: sID,
				onScan: fnHandleScan
			});

			// Register the Barcode again
			oComp._registerForBarcode();
		},

		/**
		 * Getter for the resource bundle.
		 * @public
		 * @returns {sap.ui.model.resource.ResourceModel} the resourceModel of the component
		 */
		getResourceBundle: function () {
			return this.getOwnerComponent().getModel("WorkListi18n").getResourceBundle();
		},

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function () {
			var oViewModel = (this.getModel("objectView") || this.getModel("worklistView"));
			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		onVKeypadHide: function () {
			if (window.plugin && window.plugin.firstphone) {
				window.plugin.firstphone.launcher.hideKeyboard();
				jQuery.sap.delayedCall(0, this, function () {
					window.plugin.firstphone.launcher.hideKeyboard();
				});
			}
		}
		

	});
});