sap.ui.define([
		"YRTV_ONE_TILE/YRTV_ONE_TILE/controller/Worklist/BaseController"
	], function (BaseController) {
		"use strict";

		return BaseController.extend("YRTV_ONE_TILE.YRTV_ONE_TILE.controller.Worklist.NotFound", {

			/**
			 * Navigates to the worklist when the link is pressed
			 * @public
			 */
			onLinkPressed : function () {
				this.getRouter().navTo("worklist");
			}

		});

	}
);