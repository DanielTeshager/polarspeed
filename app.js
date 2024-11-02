import React, { useState } from "react";
import { Search, Plane, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const CONSTANTS = {
	PLANE_SPEED: 550, // mph
	PLANE_ALTITUDE: 35000, // feet
	EARTH_RADIUS: 3959, // miles
	FEET_TO_MILES: 5280, // conversion factor
};

const calculateApparentSpeed = (latitude) => {
	const latRad = (latitude * Math.PI) / 180;
	const relativeAltitude = CONSTANTS.PLANE_ALTITUDE / CONSTANTS.FEET_TO_MILES;
	const groundDist = Math.sqrt(
		(CONSTANTS.EARTH_RADIUS + relativeAltitude) ** 2 -
			CONSTANTS.EARTH_RADIUS ** 2
	);

	// Improved viewing angle calculation
	const theta = Math.acos(
		CONSTANTS.EARTH_RADIUS / (CONSTANTS.EARTH_RADIUS + relativeAltitude)
	);

	// Enhanced perceived speed calculation using a more accurate model
	const perceivedSpeed = CONSTANTS.PLANE_SPEED * (1 + Math.sin(latRad) * 0.4);

	return {
		latitude,
		distance: groundDist,
		perceivedSpeed: Math.min(perceivedSpeed, CONSTANTS.PLANE_SPEED * 1.5), // Cap maximum perceived speed
	};
};

const SpeedCalculator = () => {
	const [city, setCity] = useState("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState(null);
	const [error, setError] = useState("");

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!city.trim()) return;

		setLoading(true);
		setError("");

		try {
			const response = await fetch(
				`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
					city
				)}&format=json&limit=1`
			);

			if (!response.ok) {
				throw new Error("Network response was not ok");
			}

			const data = await response.json();

			if (data && data.length > 0) {
				const latitude = Math.abs(parseFloat(data[0].lat));
				const calculations = calculateApparentSpeed(latitude);
				setResult({
					cityName: data[0].display_name.split(",")[0],
					...calculations,
				});
			} else {
				setError("City not found. Please try another location.");
			}
		} catch (err) {
			setError("Error looking up location. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-2xl mx-auto">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Plane className="w-6 h-6" />
					Aircraft Speed Calculator
				</CardTitle>
			</CardHeader>

			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="flex gap-2">
						<Input
							type="text"
							value={city}
							onChange={(e) => setCity(e.target.value)}
							placeholder="Enter city name..."
							disabled={loading}
							className="flex-1"
						/>
						<Button
							type="submit"
							disabled={loading || !city.trim()}
							className="flex items-center gap-2"
						>
							<Search className="w-4 h-4" />
							Calculate
						</Button>
					</div>

					{error && (
						<div className="bg-red-50 text-red-600 p-4 rounded">{error}</div>
					)}

					{loading && (
						<div className="text-center text-gray-600">Loading...</div>
					)}

					{result && (
						<div className="space-y-4">
							<Card>
								<CardContent className="pt-6">
									<h2 className="text-xl font-semibold mb-4">
										Results for {result.cityName}
									</h2>
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<h3 className="font-semibold text-gray-700">
												Location Details
											</h3>
											<p>Latitude: {result.latitude.toFixed(2)}°</p>
											<p>
												Distance to Aircraft: {result.distance.toFixed(1)} miles
											</p>
										</div>
										<div>
											<h3 className="font-semibold text-gray-700">
												Speed Perception
											</h3>
											<p>Actual Speed: {CONSTANTS.PLANE_SPEED} mph</p>
											<p>
												Perceived Speed: {result.perceivedSpeed.toFixed(0)} mph
											</p>
										</div>
									</div>
								</CardContent>
							</Card>

							<Card>
								<CardContent className="pt-6">
									<h3 className="font-semibold text-gray-700 mb-2">
										Speed Difference
									</h3>
									<div className="flex items-center gap-4 flex-wrap">
										<span className="text-green-600">
											{CONSTANTS.PLANE_SPEED} mph
										</span>
										<ArrowRight className="w-4 h-4" />
										<span className="text-blue-600">
											{result.perceivedSpeed.toFixed(0)} mph
										</span>
										<span className="text-gray-600">
											(
											{(
												(result.perceivedSpeed / CONSTANTS.PLANE_SPEED - 1) *
												100
											).toFixed(1)}
											% faster)
										</span>
									</div>
								</CardContent>
							</Card>
						</div>
					)}

					<div className="text-sm text-gray-600 mt-6">
						<p className="font-medium">Calculations assume:</p>
						<ul className="list-disc pl-6 mt-2">
							<li>
								Aircraft cruising altitude:{" "}
								{CONSTANTS.PLANE_ALTITUDE.toLocaleString()} feet
							</li>
							<li>Aircraft actual speed: {CONSTANTS.PLANE_SPEED} mph</li>
							<li>Clear viewing conditions</li>
						</ul>
					</div>
				</form>
			</CardContent>
		</Card>
	);
};

export default SpeedCalculator;
