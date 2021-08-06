sap.ui.define([
	"com/hd/rtvview/controller/BaseController",
	"sap/ui/model/json/JSONModel"
], function(BaseController, JSONModel) {
	"use strict";

	return BaseController.extend("com.hd.rtvview.controller.App1", {

		onInit: function() {
			var oViewModel,
				fnSetAppNotBusy,
				iOriginalBusyDelay = this.getView().getBusyIndicatorDelay();

			oViewModel = new JSONModel({
				busy: true,
				delay: 0
			});
			this.setModel(oViewModel, "appView");

			fnSetAppNotBusy = function() {
				oViewModel.setProperty("/busy", false);
				oViewModel.setProperty("/delay", iOriginalBusyDelay);
			};

			this.getOwnerComponent().getModel().metadataLoaded()
				.then(fnSetAppNotBusy);

			this.getOwnerComponent().oAppControl = this.byId("idAppControl");

			// apply content density mode to root view
			this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());

			this.getView().addEventDelegate({
				onBeforeFirstShow: function() {
					var oModel = this.getModel();
					oModel.setDefaultCountMode(sap.ui.model.odata.CountMode.None);
				}.bind(this)
			});
		},

		_onMasterClose: function() {
			var oModel = this.getModel("screen");
			oModel.setProperty("/isMasterClose", true);
		},

		_onMasterOpen: function() {
			var oModel = this.getModel("screen");
			oModel.setProperty("/isMasterClose", false);
		}

	});

});