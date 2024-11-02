// Import necessary libraries and components
import React, { useState, useEffect } from "react";
import { Search, Plane } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

// Constants for calculations
const CONSTANTS = {
	PLANE_SPEED: 550, // mph (aircraft true speed)
	EARTH_RADIUS: 3959, // miles (average radius of Earth)
};

// Function to calculate the perceived speed based on latitude
const calculateApparentSpeed = (latitude) => {
	// Convert latitude to radians
	const latRad = (latitude * Math.PI) / 180;

	// Earth's circumference at the given latitude
	const circumferenceAtLatitude =
		2 * Math.PI * CONSTANTS.EARTH_RADIUS * Math.cos(latRad);

	// Distance per degree of longitude at this latitude
	const distancePerDegree = circumferenceAtLatitude / 360;

	// Degrees covered per hour by the aircraft at this latitude
	const degreesPerHour = CONSTANTS.PLANE_SPEED / distancePerDegree;

	// Angular speed in degrees per second
	const degreesPerSecond = degreesPerHour / 3600;

	// Angular speed at the equator for comparison
	const circumferenceAtEquator = 2 * Math.PI * CONSTANTS.EARTH_RADIUS;
	const distancePerDegreeEquator = circumferenceAtEquator / 360;
	const degreesPerHourEquator =
		CONSTANTS.PLANE_SPEED / distancePerDegreeEquator;
	const degreesPerSecondEquator = degreesPerHourEquator / 3600;

	// Percentage increase in angular speed compared to equator
	const percentageIncrease =
		((degreesPerSecond - degreesPerSecondEquator) / degreesPerSecondEquator) *
		100;

	return {
		latitude,
		circumferenceAtLatitude,
		distancePerDegree,
		degreesPerHour,
		degreesPerSecond,
		percentageIncrease,
	};
};

// Component for animating the aircraft movement
const AircraftAnimator = ({ percentageIncrease }) => {
	const [equatorPosition, setEquatorPosition] = useState(0);
	const [latitudePosition, setLatitudePosition] = useState(0);

	useEffect(() => {
		let animationFrameId;
		let startTime;

		// Speeds for the animations
		const baseSpeed = 0.02; // Base speed for equator plane
		const adjustedSpeed = baseSpeed * (1 + percentageIncrease / 100); // Adjusted speed for latitude plane

		const animate = (timestamp) => {
			if (!startTime) startTime = timestamp;
			const elapsed = timestamp - startTime;

			// Update positions based on speeds
			setEquatorPosition((prev) => (prev + baseSpeed) % 100);
			setLatitudePosition((prev) => (prev + adjustedSpeed) % 100);

			animationFrameId = requestAnimationFrame(animate);
		};

		animationFrameId = requestAnimationFrame(animate);

		return () => cancelAnimationFrame(animationFrameId);
	}, [percentageIncrease]);

	return (
		<div className="space-y-6">
			{/* Equator Animation */}
			<div className="relative h-12 bg-blue-100 rounded-lg overflow-hidden">
				<div className="absolute inset-y-0 left-2 flex items-center">
					<span className="text-sm text-gray-700 font-medium">
						At Equator (0°)
					</span>
				</div>
				<div
					className="absolute top-1/2 transform -translate-y-1/2"
					style={{
						left: `${equatorPosition}%`,
					}}
				>
					<Plane className="w-6 h-6 text-blue-600" />
				</div>
			</div>

			{/* Latitude Animation */}
			<div className="relative h-12 bg-green-100 rounded-lg overflow-hidden">
				<div className="absolute inset-y-0 left-2 flex items-center">
					<span className="text-sm text-gray-700 font-medium">
						At Latitude ({percentageIncrease.toFixed(1)}% faster)
					</span>
				</div>
				<div
					className="absolute top-1/2 transform -translate-y-1/2"
					style={{
						left: `${latitudePosition}%`,
					}}
				>
					<Plane className="w-6 h-6 text-green-600" />
				</div>
			</div>

			<p className="text-sm text-gray-700">
				This animation demonstrates how an aircraft appears to move faster
				across the sky at higher latitudes due to increased angular speed.
			</p>
		</div>
	);
};

// Main component for the Speed Calculator
const SpeedCalculator = () => {
	const [city, setCity] = useState("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState(null);
	const [error, setError] = useState("");

	// Handle form submission
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

			if (!response.ok) throw new Error("Network response was not ok");

			const data = await response.json();

			if (data && data.length > 0) {
				const latitude = parseFloat(data[0].lat);
				const calculations = calculateApparentSpeed(Math.abs(latitude));
				setResult({
					cityName: data[0].display_name.split(",")[0],
					latitude: latitude,
					...calculations,
				});
			} else {
				setError("City not found. Please try another location.");
			}
		} catch (err) {
			setError("Error looking up location. Please try again.");
			console.error("Submit error:", err);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
			<div className="flex items-center gap-2 mb-6">
				<Plane className="w-6 h-6 text-indigo-600" />
				<h1 className="text-2xl font-bold text-gray-800">
					Aircraft Perceived Speed Calculator
				</h1>
			</div>

			<form onSubmit={handleSubmit} className="mb-6">
				<div className="flex gap-2">
					<Input
						type="text"
						value={city}
						onChange={(e) => setCity(e.target.value)}
						placeholder="Enter city name..."
						disabled={loading}
						className="flex-1"
					/>
					<Button type="submit" disabled={loading || !city.trim()}>
						{loading ? "Calculating..." : "Calculate"}
					</Button>
				</div>
			</form>

			{error && (
				<div className="bg-red-50 text-red-600 p-4 rounded mb-4">{error}</div>
			)}

			{result && (
				<div className="space-y-6">
					{/* Results Card */}
					<Card>
						<CardContent className="pt-6">
							<h2 className="text-xl font-semibold mb-4 text-gray-800">
								Results for {result.cityName}
							</h2>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
								{/* Location Details */}
								<div>
									<h3 className="font-semibold mb-2 text-gray-700">
										Location Details
									</h3>
									<div className="space-y-1 text-gray-700">
										<p>Latitude: {result.latitude.toFixed(2)}°</p>
										<p>
											Earth's Circumference at Latitude:{" "}
											{result.circumferenceAtLatitude.toFixed(0)} miles
										</p>
										<p>
											Distance per Degree of Longitude:{" "}
											{result.distancePerDegree.toFixed(2)} miles
										</p>
									</div>
								</div>

								{/* Angular Speed Analysis */}
								<div>
									<h3 className="font-semibold mb-2 text-gray-700">
										Angular Speed Analysis
									</h3>
									<div className="space-y-1 text-gray-700">
										<p>
											Degrees Covered per Hour:{" "}
											{result.degreesPerHour.toFixed(2)}°/hr
										</p>
										<p>
											Angular Speed: {result.degreesPerSecond.toFixed(5)}°/sec
										</p>
										<p>
											Increase Compared to Equator:{" "}
											{result.percentageIncrease.toFixed(2)}%
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Perceived Speed Difference */}
					<Card>
						<CardContent className="pt-6">
							<h3 className="font-semibold mb-4 text-gray-700">
								Perceived Speed Difference
							</h3>
							<div className="flex items-center gap-4">
								<span className="text-blue-600 font-medium">
									At Equator: {CONSTANTS.PLANE_SPEED} mph
								</span>
								<span className="text-gray-500">→</span>
								<span className="text-green-600 font-medium">
									At {Math.abs(result.latitude).toFixed(2)}°:{" "}
									{CONSTANTS.PLANE_SPEED} mph
								</span>
							</div>
							<p className="text-gray-700 mt-2">
								({result.percentageIncrease.toFixed(2)}% faster apparent motion)
							</p>
						</CardContent>
					</Card>

					{/* Animation */}
					<Card>
						<CardContent className="pt-6">
							<AircraftAnimator
								percentageIncrease={result.percentageIncrease}
							/>
						</CardContent>
					</Card>

					{/* Explanation */}
					<div className="text-gray-700 space-y-4">
						<p>
							The aircraft appears to move faster at higher latitudes due to the
							Earth's geometry. As you move toward the poles, the Earth's
							circumference decreases, causing the plane to cover more degrees
							of longitude per hour, increasing its apparent angular speed
							across the sky.
						</p>

						<div>
							<p className="font-medium mb-2">Calculations assume:</p>
							<ul className="list-disc pl-6 space-y-1">
								<li>Aircraft true speed: {CONSTANTS.PLANE_SPEED} mph</li>
								<li>
									Aircraft flying east-west along a line of constant latitude
								</li>
								<li>Observer is stationary on the ground</li>
								<li>Clear viewing conditions</li>
								<li>Earth is a perfect sphere</li>
							</ul>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};

export default SpeedCalculator;
