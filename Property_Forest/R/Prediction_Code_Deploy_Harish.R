require("ggplot2")
require("randomForest")

#rf2 <- readRDS("RandomForest.rds")
load("CloudComp_Package.RData")
load("Original_Data.RData")
load("NewRF.RData")

## This code takes arguments as inputs

args <- commandArgs(trailingOnly = TRUE)
args
town_input <- args[1]
flat_type_input <- args[2]
floor_space_input <- args[3]
mrt_input <- args[4]
filename_input <- args[5]

## Debug code to test 

#town_input <- as.factor("WOODLANDS")
#flat_type_input <- as.factor("4 ROOM")
#floor_space_input <- 75
#mrt_input <- 50
#filename_input <-'test'

hdb_data <- data.frame(town = town_input, flat_type = flat_type_input, floor_area_sqm = floor_space_input,  
                        nearest_mrt_dist = mrt_input , resale_price = 0)


test_2 <- test[1:20,c("town","flat_type","floor_area_sqm","nearest_mrt_dist","resale_price")]
test_2 <- rbind(test_2,hdb_data)

pred <- predict(new_rf, test_2[nrow(test_2),])
pred

price<-paste('@',floor(pred),'@')
sqmPrice<-paste('@',floor(pred/as.numeric(floor_space_input)),'@')
price
sqmPrice

#For Plotting and Predictions
filename<-paste('results/',filename_input,'.png')
filename<-gsub(' ','',filename)
png(filename)
plot_set <- subset(train, town == test_2[nrow(test_2),"town"] & flat_type == test_2[nrow(test_2),"flat_type"])

#string <- paste("Predicted Price is ",floor(pred)," and price distribution")
qplot(plot_set$resale_price, bins = 10,col = (plot_set$flat_type) ,fill= plot_set$flat_model ,ylab = "Available Housing", xlab = "Resale Price" , main = 'Price Distribution')

#string <- paste("Price Per SqM is ",floor(pred/floor_space_input)," and Price Distribution")
#qplot(plot_set$resale_price/plot_set$floor_area_sqm , bins = 10,col = (plot_set$flat_type) ,fill= plot_set$flat_model ,ylab = "Available Housing", xlab = "Price Per Sq M" , main = string)


