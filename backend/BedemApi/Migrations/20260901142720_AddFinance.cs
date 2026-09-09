using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace BedemApi.Migrations
{
    /// <inheritdoc />
    public partial class AddFinance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FinanceCategories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: false),
                    Color = table.Column<string>(type: "text", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceCategories", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FinanceQuarters",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    Quarter = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceQuarters", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FinanceYears",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Year = table.Column<int>(type: "integer", nullable: false),
                    MemberCount = table.Column<int>(type: "integer", nullable: false),
                    ReserveFund = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    ReportUrl = table.Column<string>(type: "text", nullable: true),
                    IsPublished = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceYears", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FinanceEntries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CategoryId = table.Column<int>(type: "integer", nullable: false),
                    Amount = table.Column<decimal>(type: "numeric(18,2)", precision: 18, scale: 2, nullable: false),
                    Date = table.Column<DateOnly>(type: "date", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    CreatedByUserId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceEntries", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FinanceEntries_FinanceCategories_CategoryId",
                        column: x => x.CategoryId,
                        principalTable: "FinanceCategories",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FinanceEntries_Users_CreatedByUserId",
                        column: x => x.CreatedByUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "FinanceCategories",
                columns: new[] { "Id", "Color", "DisplayOrder", "IsActive", "Name", "Type" },
                values: new object[,]
                {
                    { 1, "primary", 0, true, "Članarine", "Income" },
                    { 2, "secondary", 1, true, "Donacije građana", "Income" },
                    { 3, "success", 2, true, "Donacije organizacija", "Income" },
                    { 4, "neutral", 3, true, "Prihodi od projekata", "Income" },
                    { 5, "primary", 0, true, "Pravna pomoć i zastupanje", "Expense" },
                    { 6, "secondary", 1, true, "Organizovanje akcija", "Expense" },
                    { 7, "accent", 2, true, "Plate i naknade", "Expense" },
                    { 8, "neutral", 3, true, "Administrativni troškovi", "Expense" },
                    { 9, "success", 4, true, "Komunikacije i marketing", "Expense" },
                    { 10, "neutral", 5, true, "Rezerve i fond", "Expense" }
                });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$f0m5H0H79iFNTCiRA.0wZupLCaSyIbItJT9q6WYDwx14XkjoM/iHa");

            migrationBuilder.CreateIndex(
                name: "IX_FinanceCategories_Type_DisplayOrder",
                table: "FinanceCategories",
                columns: new[] { "Type", "DisplayOrder" });

            migrationBuilder.CreateIndex(
                name: "IX_FinanceEntries_CategoryId",
                table: "FinanceEntries",
                column: "CategoryId");

            migrationBuilder.CreateIndex(
                name: "IX_FinanceEntries_CreatedByUserId",
                table: "FinanceEntries",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FinanceEntries_Date",
                table: "FinanceEntries",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_FinanceQuarters_Year_Quarter",
                table: "FinanceQuarters",
                columns: new[] { "Year", "Quarter" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FinanceYears_Year",
                table: "FinanceYears",
                column: "Year",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FinanceEntries");

            migrationBuilder.DropTable(
                name: "FinanceQuarters");

            migrationBuilder.DropTable(
                name: "FinanceYears");

            migrationBuilder.DropTable(
                name: "FinanceCategories");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$7SbqueNQB99vxfJnCTbndeMJ8hf2q7sQMhgfdU/yT3MbQQ6BNDxk.");
        }
    }
}
