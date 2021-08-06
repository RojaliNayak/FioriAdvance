sap.ui.define([
		"YRTV_ONE_TILE/YRTV_ONE_TILE/controller/Worklist/BaseController",
		"sap/ui/model/json/JSONModel"
	], function (BaseController, JSONModel) {
		"use strict";

		return BaseController.extend("YRTV_ONE_TILE.YRTV_ONE_TILE.controller.Worklist.App", {

			onInit : function () {
				var oViewModel,
					fnSetAppNotBusy,
					iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

				oViewModel = new JSONModel({
					busy : false,
					delay : 0
				});
				oViewModel.setSizeLimit(1000);
				this.setModel(oViewModel, "appView");

				fnSetAppNotBusy = function() {
					oViewModel.setProperty("/busy", false);
					oViewModel.setProperty("/delay", iOriginalBusyDelay);
				};

				// apply content density mode to root view
				this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
			}
		});
	}
);