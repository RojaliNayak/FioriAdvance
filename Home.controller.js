sap.ui.define([
	"sap/ui/core/mvc/Controller"
], function (Controller) {
	"use strict";

	return Controller.extend("YRTV_ONE_TILE.YRTV_ONE_TILE.controller.Home", {

		/**
		 * Called when a controller is instantiated and its View controls (if available) are already created.
		 * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
		 * @memberOf YRTV_ONE_TILE.YRTV_ONE_TILE.view.Home
		 */
		onInit: function () {

			var oModel = this.getOwnerComponent().getModel();
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel");
			this.getView().setModel(oAuthModel, oAuthModel);
			sap.ui.core.BusyIndicator.show();
			oModel.read("/UserAuthSet", {
				success: function (oData, response) {
					oAuthModel.setData(oData.results[0]);
					sap.ui.core.BusyIndicator.hide();
				},
				error: function (oError) {
					sap.ui.core.BusyIndicator.hide();
				}
			});
			this.getOwnerComponent().getRouter().getRoute("home").attachPatternMatched(this.onPatternMatched, this);
		},

		onPatternMatched: function (oEvent) {
			var oAuthModel = this.getOwnerComponent().getModel("oAuthModel");
		},

		onMenuButtonPress: function () {
			var oRouter = this.getOwnerComponent().getRouter();
			oRouter.navTo("Menu", {});
			// this.onScanField("barcodeInput");
		},

		onAdvanceSearch: function () {
			if (!this._oDialog) {
				// create dialog via fragment factory
				this._oDialog = sap.ui.xmlfragment("YRTV_ONE_TILE.YRTV_ONE_TILE.fragments.AdvancedSearch", this);
				// sap.ui.getCore().byId('addButton').focus();
				// connect dialog to view (models, lifecycle)
				this.getView().addDependent(this._oDialog);
				this._oDialog.open();
			}
		},

		onDialogRTVBackPress: function (evt) {
			this._oDialog.close();
		},

		onVerifyLabel: function (evt) {
			this.getOwnerComponent().getRouter().navTo("VerifyItems");
		},

		onMetWorklist: function (evt) {
			var oldLink = document.getElementsByTagName("link")["baseCSS"];
			var newLink = document.createElement("link");
			newLink.setAttribute("rel", "stylesheet");
			newLink.setAttribute("type", "text/css");
			newLink.setAttribute("id", "baseCSS");
			newLink.setAttribute("href", "css/METWorklist/style.css");

			//Save old link for navigating back to home
			$.sap.rootCSS = oldLink;
			this.getOwnerComponent().metWorklist();
			document.getElementsByTagName("head")[0].replaceChild(newLink, oldLink);
			this.getOwnerComponent().getRouter().navTo("METWorklist", {});
		},

		onNavBack: function () {
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");
			oCrossAppNavigator.toExternal({
				target: {
					shellHash: "#Shell-home"
				}
			});
		}

		/**
		 * Similar to onAfterRendering, but this hook is invoked before the controller's View is re-rendered
		 * (NOT before the first rendering! onInit() is used for that one!).
		 * @memberOf YRTV_ONE_TILE.YRTV_ONE_TILE.view.Home
		 */
		//	onBeforeRendering: function() {
		//
		//	},

		/**
		 * Called when the View has been rendered (so its HTML is part of the document). Post-rendering manipulations of the HTML could be done here.
		 * This hook is the same one that SAPUI5 controls get after being rendered.
		 * @memberOf YRTV_ONE_TILE.YRTV_ONE_TILE.view.Home
		 */
		//	onAfterRendering: function() {
		//
		//	},

		/**
		 * Called when the Controller is destroyed. Use this one to free resources and finalize activities.
		 * @memberOf YRTV_ONE_TILE.YRTV_ONE_TILE.view.Home
		 */
		//	onExit: function() {
		//
		//	}

	});

});