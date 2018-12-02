#!/bin/bash
c=1
while [ $c -le 33000 ]
do
	echo "Ran $c times"
	node distance.js
	(( c++ ))
done
