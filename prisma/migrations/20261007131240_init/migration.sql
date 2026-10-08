-- CreateEnum
CREATE TYPE "CabinClass" AS ENUM ('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('ACTIVE', 'TRIGGERED', 'PAUSED', 'DELETED');

-- CreateEnum
CREATE TYPE "DateFlexibility" AS ENUM ('EXACT', 'PLUS_MINUS_3', 'ANY');

-- CreateEnum
CREATE TYPE "TripDuration" AS ENUM ('ANY', 'WEEKEND', 'SHORT', 'WEEK', 'TWO_WEEKS');

-- CreateEnum
CREATE TYPE "AlertEventType" AS ENUM ('CREATED', 'CHECKED', 'TRIGGERED', 'PAUSED', 'RESUMED', 'DELETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "passwordHash" TEXT,
    "homeAirport" TEXT DEFAULT 'DOH',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("provider","providerAccountId")
);

-- CreateTable
CREATE TABLE "Session" (
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("identifier","token")
);

-- CreateTable
CREATE TABLE "Airport" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "timezone" TEXT NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "Airport_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "airportCode" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightDeal" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "originCode" TEXT NOT NULL,
    "destinationCode" TEXT NOT NULL,
    "departureDate" DATE NOT NULL,
    "returnDate" DATE,
    "airlineCode" TEXT NOT NULL,
    "airlineName" TEXT NOT NULL,
    "stops" INTEGER NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "cabin" "CabinClass" NOT NULL DEFAULT 'ECONOMY',
    "price" INTEGER NOT NULL,
    "typicalPrice" INTEGER,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "data" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlightDeal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dealId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "originCode" TEXT NOT NULL,
    "destinationCode" TEXT,
    "maxPrice" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "dateFlexibility" "DateFlexibility" NOT NULL DEFAULT 'ANY',
    "departureDate" DATE,
    "tripDuration" "TripDuration" NOT NULL DEFAULT 'ANY',
    "maxStops" INTEGER,
    "cabin" "CabinClass" NOT NULL DEFAULT 'ECONOMY',
    "status" "AlertStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastCheckedAt" TIMESTAMP(3),
    "lastSeenPrice" INTEGER,
    "triggeredAt" TIMESTAMP(3),
    "triggeredPrice" INTEGER,
    "triggeredDealId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AlertEvent" (
    "id" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "type" "AlertEventType" NOT NULL,
    "price" INTEGER,
    "dealId" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Search" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "originCode" TEXT NOT NULL,
    "destination" TEXT,
    "departureDate" DATE,
    "returnDate" DATE,
    "query" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "cheapestPrice" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Search_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "originCode" TEXT NOT NULL,
    "destinationCode" TEXT NOT NULL,
    "cabin" "CabinClass" NOT NULL DEFAULT 'ECONOMY',
    "observedOn" DATE NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Airport_city_idx" ON "Airport"("city");

-- CreateIndex
CREATE INDEX "Airport_countryCode_idx" ON "Airport"("countryCode");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_slug_key" ON "Destination"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_airportCode_key" ON "Destination"("airportCode");

-- CreateIndex
CREATE INDEX "Destination_country_idx" ON "Destination"("country");

-- CreateIndex
CREATE INDEX "FlightDeal_originCode_price_idx" ON "FlightDeal"("originCode", "price");

-- CreateIndex
CREATE INDEX "FlightDeal_destinationCode_idx" ON "FlightDeal"("destinationCode");

-- CreateIndex
CREATE INDEX "FlightDeal_departureDate_idx" ON "FlightDeal"("departureDate");

-- CreateIndex
CREATE INDEX "Favorite_userId_createdAt_idx" ON "Favorite"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_dealId_key" ON "Favorite"("userId", "dealId");

-- CreateIndex
CREATE INDEX "PriceAlert_userId_status_idx" ON "PriceAlert"("userId", "status");

-- CreateIndex
CREATE INDEX "PriceAlert_status_lastCheckedAt_idx" ON "PriceAlert"("status", "lastCheckedAt");

-- CreateIndex
CREATE INDEX "AlertEvent_alertId_createdAt_idx" ON "AlertEvent"("alertId", "createdAt");

-- CreateIndex
CREATE INDEX "Search_userId_createdAt_idx" ON "Search"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Search_originCode_createdAt_idx" ON "Search"("originCode", "createdAt");

-- CreateIndex
CREATE INDEX "PriceHistory_destinationCode_idx" ON "PriceHistory"("destinationCode");

-- CreateIndex
CREATE UNIQUE INDEX "PriceHistory_originCode_destinationCode_cabin_observedOn_key" ON "PriceHistory"("originCode", "destinationCode", "cabin", "observedOn");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_airportCode_fkey" FOREIGN KEY ("airportCode") REFERENCES "Airport"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightDeal" ADD CONSTRAINT "FlightDeal_originCode_fkey" FOREIGN KEY ("originCode") REFERENCES "Airport"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightDeal" ADD CONSTRAINT "FlightDeal_destinationCode_fkey" FOREIGN KEY ("destinationCode") REFERENCES "Airport"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_dealId_fkey" FOREIGN KEY ("dealId") REFERENCES "FlightDeal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlertEvent" ADD CONSTRAINT "AlertEvent_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "PriceAlert"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Search" ADD CONSTRAINT "Search_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_originCode_fkey" FOREIGN KEY ("originCode") REFERENCES "Airport"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_destinationCode_fkey" FOREIGN KEY ("destinationCode") REFERENCES "Airport"("code") ON DELETE RESTRICT ON UPDATE CASCADE;
