import React, { useState, useEffect } from "react";
import { Plane } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";

const AircraftAnimator = ({ percentageIncrease = 0 }) => {
	const [equatorPosition, setEquatorPosition] = useState(0);
	const [latitudePosition, setLatitudePosition] = useState(0);

	// Base speed for equator animation (pixels per second)
	const baseSpeed = 100;

	// Calculate the adjusted speed based on percentage increase
	const adjustedSpeed = baseSpeed * (1 + percentageIncrease / 100);

	useEffect(() => {
		const animate = () => {
			setEquatorPosition((prev) => {
				const newPos = prev + 1;
				return newPos > 100 ? 0 : newPos;
			});

			setLatitudePosition((prev) => {
				const newPos = prev + (1 + percentageIncrease / 100);
				return newPos > 100 ? 0 : newPos;
			});
		};

		const equatorInterval = setInterval(animate, (1000 / baseSpeed) * 30);

		return () => {
			clearInterval(equatorInterval);
		};
	}, [percentageIncrease]);

	return (
		<Card className="w-full">
			<CardContent className="pt-6">
				<div className="space-y-8">
					{/* Equator Animation */}
					<div className="relative h-16 bg-blue-50 rounded-lg overflow-hidden">
						<div className="absolute top-0 left-0 w-full h-full flex items-center">
							<div
								className="absolute transform -translate-y-1/2"
								style={{
									left: `${equatorPosition}%`,
									transition: "left 0.03s linear",
								}}
							>
								<Plane className="w-8 h-8 text-blue-600" />
							</div>
							<div className="absolute left-2 text-sm text-gray-600">
								At Equator (0°)
							</div>
						</div>
					</div>

					{/* Latitude Animation */}
					<div className="relative h-16 bg-blue-50 rounded-lg overflow-hidden">
						<div className="absolute top-0 left-0 w-full h-full flex items-center">
							<div
								className="absolute transform -translate-y-1/2"
								style={{
									left: `${latitudePosition}%`,
									transition: "left 0.03s linear",
								}}
							>
								<Plane className="w-8 h-8 text-green-600" />
							</div>
							<div className="absolute left-2 text-sm text-gray-600">
								At Selected Latitude ({percentageIncrease.toFixed(1)}%{" "}
								{percentageIncrease >= 0 ? "faster" : "slower"})
							</div>
						</div>
					</div>
				</div>

				<div className="mt-4 text-sm text-gray-600">
					<p>
						This animation demonstrates the relative apparent motion of aircraft
						at different latitudes. The actual speed remains constant, but the
						apparent angular velocity changes due to Earth's geometry.
					</p>
				</div>
			</CardContent>
		</Card>
	);
};

export default AircraftAnimator;
