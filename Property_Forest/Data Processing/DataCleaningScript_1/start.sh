#!/bin/bash
c=1
while [ $c -le 5000 ]
do
	echo "Ran $c times"
	node app.js
	(( c++ ))
done
