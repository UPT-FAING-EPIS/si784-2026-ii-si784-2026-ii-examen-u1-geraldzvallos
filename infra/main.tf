terraform {
  required_version = ">= 1.5"
  required_providers {
    azurerm = { source = "hashicorp/azurerm", version = "~> 3.100" }
  }
}

provider "azurerm" {
  features {}
}

variable "app_name" {
  type        = string
  description = "Nombre unico global de la Web App"
}
variable "location" {
  type    = string
  default = "eastus2"
}
variable "docker_image" {
  type        = string
  description = "Imagen en GHCR, ej: ghcr.io/usuario/lavanderia"
}

resource "azurerm_resource_group" "rg" {
  name     = "rg-${var.app_name}"
  location = var.location
}

resource "azurerm_service_plan" "plan" {
  name                = "plan-${var.app_name}"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  os_type             = "Linux"
  sku_name            = "B1"
}

resource "azurerm_linux_web_app" "app" {
  name                      = var.app_name
  resource_group_name       = azurerm_resource_group.rg.name
  location                  = azurerm_resource_group.rg.location
  service_plan_id           = azurerm_service_plan.plan.id
  https_only                = true
  app_settings = {
    WEBSITES_PORT                       = "3000"
    DB_FILE                             = "/home/lavanderia.db"
    WEBSITES_ENABLE_APP_SERVICE_STORAGE = "true"
  }
  site_config {
    application_stack {
      docker_image_name   = "${var.docker_image}:latest"
      docker_registry_url = "https://ghcr.io"
    }
    health_check_path = "/health"
  }
}

output "app_url" {
  value = "https://${azurerm_linux_web_app.app.default_hostname}"
}
