require("ggplot2")
require("randomForest")

#rf2 <- readRDS("RandomForest.rds")
load("https://dl.dropboxusercontent.com/u/20829323/CloudComp_Package.RData")


town_input <- "TAMPINES"
flat_type_input <- "2 ROOM"
flat_model_input <- "New Generation"
lease_commence_data_input <- "01-01-95"

hdb_data <- data.frame(town = town_input, flat_type = flat_type_input, floor_area_sqm = 40, flat_model = flat_model_input, 
                       lease_commence_date = lease_commence_data_input, nearest_mrt_dist = 70, sch_in_radius = 0)

levels(hdb_data$town) <- levels(test$town)
levels(hdb_data$flat_type) <- levels(test$flat_type)
levels(hdb_data$flat_model) <- levels(test$flat_model)
levels(hdb_data$lease_commence_date) <- levels(test$lease_commence_date)

pred <- predict(rf, hdb_data)
pred


#For Plotting and Predictions
plot_set <- subset(train, town == town_input & flat_type == flat_type_input & floor_area_sqm > 40 )
summary(plot_set)
qplot(plot_set$resale_price, bins = 10, fill= plot_set$flat_model ,ylab = "Available Housing", xlab = "Resale Price" )

